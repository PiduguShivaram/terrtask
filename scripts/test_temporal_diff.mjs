import jpeg from 'jpeg-js';

async function testTemporalDiff() {
  const date1 = '2019-05-01';
  const date2 = '2019-05-03';
  const minLon = 80.0, minLat = 14.0, maxLon = 92.0, maxLat = 24.0;
  const width = 450, height = 300;

  const url1 = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date1}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=${width}&HEIGHT=${height}`;
  const url2 = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date2}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=${width}&HEIGHT=${height}`;

  console.log('Fetching image 1 (Before):', date1);
  const buf1 = Buffer.from(await (await fetch(url1)).arrayBuffer());
  console.log('Fetching image 2 (During):', date2);
  const buf2 = Buffer.from(await (await fetch(url2)).arrayBuffer());

  const dec1 = jpeg.decode(buf1, { useTArray: true });
  const dec2 = jpeg.decode(buf2, { useTArray: true });

  console.log('Decoded Dimensions 1:', dec1.width, 'x', dec1.height);
  console.log('Decoded Dimensions 2:', dec2.width, 'x', dec2.height);

  let totalDiff = 0;
  let significantChangePixels = 0;
  let validPixels = 0;
  const totalPixels = dec1.width * dec1.height;

  for (let i = 0; i < dec1.data.length; i += 4) {
    const r1 = dec1.data[i], g1 = dec1.data[i+1], b1 = dec1.data[i+2];
    const r2 = dec2.data[i], g2 = dec2.data[i+1], b2 = dec2.data[i+2];

    const lum1 = 0.299*r1 + 0.587*g1 + 0.114*b1;
    const lum2 = 0.299*r2 + 0.587*g2 + 0.114*b2;

    const diff = Math.abs(lum2 - lum1);
    totalDiff += diff;
    if (diff > 50) significantChangePixels++;
    validPixels++;
  }

  const meanAbsDiff = Math.round((totalDiff / validPixels) * 10) / 10;
  const changedAreaPct = Math.round((significantChangePixels / validPixels) * 1000) / 10;

  console.log('Mean Absolute Optical Difference (0-255):', meanAbsDiff);
  console.log('Significantly Changed Visual Area (%):', changedAreaPct, '%');
}

testTemporalDiff();
