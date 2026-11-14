// awkvision: person matte video + face track from one pass over a video (Apple Vision, on-device).
//
//   awkvision IN.mp4 OUT_mask.mp4 OUT_faces.json [--fast]
//
// OUT_mask.mp4  white = person, black = background, same size/fps as IN (H.264).
// OUT_faces.json {"w":W,"h":H,"fps":F,"frames":N,"faces":[[t,x,y,w,h] | [t] ...]}  (x,y = top-left, pixels)
import AVFoundation
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 4 else {
	FileHandle.standardError.write("usage: awkvision IN OUT_mask.mp4 OUT_faces.json [--fast]\n".data(using: .utf8)!)
	exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let maskURL = URL(fileURLWithPath: args[2])
let facesURL = URL(fileURLWithPath: args[3])
let fast = args.contains("--fast")

let asset = AVURLAsset(url: inURL)
let sem = DispatchSemaphore(value: 0)
var track: AVAssetTrack?
var fps: Float = 30
var natural = CGSize.zero
Task {
	track = try? await asset.loadTracks(withMediaType: .video).first
	if let t = track {
		fps = (try? await t.load(.nominalFrameRate)) ?? 30
		natural = (try? await t.load(.naturalSize)) ?? .zero
	}
	sem.signal()
}
sem.wait()
guard let vt = track else { print("no video track"); exit(1) }
let W = Int(natural.width), H = Int(natural.height)

let reader = try AVAssetReader(asset: asset)
let out = AVAssetReaderTrackOutput(track: vt, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
out.alwaysCopiesSampleData = false
reader.add(out)
reader.startReading()

try? FileManager.default.removeItem(at: maskURL)
let writer = try AVAssetWriter(outputURL: maskURL, fileType: .mp4)
let winput = AVAssetWriterInput(mediaType: .video, outputSettings: [
	AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
	AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 6_000_000],
])
winput.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: winput, sourcePixelBufferAttributes: [
	kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H,
])
writer.add(winput)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let ctx = CIContext(options: [.cacheIntermediates: false])
let segReq = VNGeneratePersonSegmentationRequest()
segReq.qualityLevel = fast ? .balanced : .accurate
segReq.outputPixelFormat = kCVPixelFormatType_OneComponent8
let seqHandler = VNSequenceRequestHandler()   // lets Vision smooth the matte over time
let faceReq = VNDetectFaceRectanglesRequest()

var faces: [[Double]] = []
var n = 0
var lastMask: CIImage? = nil
while let sb = out.copyNextSampleBuffer() {
	guard let pb = CMSampleBufferGetImageBuffer(sb) else { continue }
	let t = CMSampleBufferGetPresentationTimeStamp(sb).seconds
	try? seqHandler.perform([segReq], on: pb)
	var mask: CIImage
	if let m = segReq.results?.first?.pixelBuffer {
		var ci = CIImage(cvPixelBuffer: m)
		ci = ci.transformed(by: CGAffineTransform(scaleX: CGFloat(W) / ci.extent.width, y: CGFloat(H) / ci.extent.height))
		mask = ci
		lastMask = ci
	} else {
		mask = lastMask ?? CIImage(color: .black).cropped(to: CGRect(x: 0, y: 0, width: W, height: H))
	}
	// faces every 3rd frame
	if n % 3 == 0 {
		let fh = VNImageRequestHandler(cvPixelBuffer: pb, options: [:])
		try? fh.perform([faceReq])
		if let f = (faceReq.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }) {
			let b = f.boundingBox
			faces.append([t, Double(b.minX) * Double(W), Double(1 - b.maxY) * Double(H), Double(b.width) * Double(W), Double(b.height) * Double(H)])
		} else {
			faces.append([t])
		}
	}
	while !winput.isReadyForMoreMediaData { usleep(2000) }
	var outPB: CVPixelBuffer?
	CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &outPB)
	if let o = outPB {
		ctx.render(mask, to: o)
		adaptor.append(o, withPresentationTime: CMTime(value: CMTimeValue(n), timescale: CMTimeScale(fps.rounded())))
	}
	n += 1
	if n % 150 == 0 { print("frames", n) }
}
winput.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()

let json: [String: Any] = ["w": W, "h": H, "fps": Double(fps), "frames": n, "faces": faces]
try JSONSerialization.data(withJSONObject: json).write(to: facesURL)
print("done", n, "frames", writer.status == .completed ? "ok" : "writer error \(String(describing: writer.error))")
