import jpeg from 'jpeg-js';

async function testSatelliteProcessing() {
  const date = '2019-05-03';
  const minLon = 80.0;
  const minLat = 14.0;
  const maxLon = 92.0;
  const maxLat = 24.0;
  const width = 450;
  const height = 300;
  
  const url = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=${width}&HEIGHT=${height}`;
  
  console.log('Fetching real NASA GIBS snapshot from NASA EOSDIS...');
  const res = await fetch(url);
  console.log('HTTP Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log('Downloaded buffer size:', buffer.length, 'bytes');

  // Decode actual JPEG pixels
  const rawImageData = jpeg.decode(buffer, { useTArray: true });
  console.log('Decoded Dimensions:', rawImageData.width, 'x', rawImageData.height);

  const { data, width: imgW, height: imgH } = rawImageData;
  const totalPixels = imgW * imgH;
  
  let totalR = 0, totalG = 0, totalB = 0, totalLum = 0;
  let validPixels = 0;
  let highReflectanceCloudPixels = 0; // Convective cloud proxy

  // IBTrACS storm center for Fani: 19.6N, 85.7E
  const stormLat = 19.6;
  const stormLon = 85.7;
  const centerPixelX = Math.round(((stormLon - minLon) / (maxLon - minLon)) * imgW);
  const centerPixelY = Math.round(((maxLat - stormLat) / (maxLat - minLat)) * imgH);
  console.log('IBTrACS Storm Center Pixel:', [centerPixelX, centerPixelY]);

  let sumWeightedX = 0, sumWeightedY = 0, sumCloudWeight = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check if pixel is not black/missing (swath edge)
    if (r > 5 || g > 5 || b > 5) {
      validPixels++;
      totalR += r;
      totalG += g;
      totalB += b;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;

      if (lum > 180) {
        highReflectanceCloudPixels++;
        const pixelIdx = i / 4;
        const px = pixelIdx % imgW;
        const py = Math.floor(pixelIdx / imgW);
        const weight = (lum - 180) / 75; // weight proportional to brightness
        sumWeightedX += px * weight;
        sumWeightedY += py * weight;
        sumCloudWeight += weight;
      }
    }
  }

  const validDataCoveragePct = Math.round((validPixels / totalPixels) * 1000) / 10;
  const meanLum = validPixels > 0 ? Math.round(totalLum / validPixels * 10) / 10 : 0;
  const cloudFractionPct = validPixels > 0 ? Math.round((highReflectanceCloudPixels / validPixels) * 1000) / 10 : 0;

  if (sumCloudWeight > 0) {
    const centroidX = sumWeightedX / sumCloudWeight;
    const centroidY = sumWeightedY / sumCloudWeight;

    // Convert pixel coordinate back to geographic latitude / longitude
    const centroidLon = minLon + (centroidX / imgW) * (maxLon - minLon);
    const centroidLat = maxLat - (centroidY / imgH) * (maxLat - minLat);

    // Calculate distance between IBTrACS storm center and cloud brightness centroid
    const dLat = (centroidLat - stormLat) * Math.PI / 180;
    const dLon = (centroidLon - stormLon) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(stormLat*Math.PI/180) * Math.cos(centroidLat*Math.PI/180) * Math.sin(dLon/2)**2;
    const centroidOffsetKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;

    console.log('Dense Cloud Centroid Geo:', centroidLat.toFixed(2) + '°N', centroidLon.toFixed(2) + '°E');
    console.log('Distance from IBTrACS Eye to Dense Cloud Centroid:', centroidOffsetKm, 'km');
  }

  console.log('Valid Pixel Coverage:', validDataCoveragePct, '%');
  console.log('Mean Optical Brightness (0-255):', meanLum);
  console.log('Dense Convective Cloud Fraction:', cloudFractionPct, '%');
}

testSatelliteProcessing();
