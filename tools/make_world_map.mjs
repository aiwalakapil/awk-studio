// Builds studio/public/maps/world.svg from Natural Earth 1:110m (public domain) via world-atlas (ISC).
// Equirectangular, latitude 84°N..58°S (no Antarctica), so a pin is simply:
//   x = (lon + 180) / 360,  y = (84 - lat) / 142      (fractions of the image)
// Run once:  npm i d3-geo@3 topojson-client@3 world-atlas@2 && node make_world_map.mjs OUT.svg
import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {geoEquirectangular, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'));
const W = 2000, H = Math.round((W * 142) / 360);
const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, (84 / 142) * H]);
const path = geoPath(proj);
const countries = feature(topo, topo.objects.countries).features.filter((f) => f.properties.name !== 'Antarctica');
const paths = countries.map((f) => `<path d="${path(f)}"/>`).join('');
writeFileSync(process.argv[2] ?? 'world.svg',
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g fill="#4A5D78" stroke="#ffffff" stroke-width="0.8" stroke-linejoin="round">${paths}</g></svg>`);
console.log('countries', countries.length, 'size', W, H);
