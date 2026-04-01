import { Document, NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const outDir = path.join(path.dirname(__filename), '../../public/assets/anatomy/geometry');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function createBox(filename, size, colorArray) {
  const doc = new Document();
  const scene = doc.createScene('Scene');
  
  const sx = size[0], sy = size[1], sz = size[2];
  const pos = new Float32Array([
    -sx, -sy,  sz,   sx, -sy,  sz,   sx,  sy,  sz,  -sx,  sy,  sz,
    -sx, -sy, -sz,   sx, -sy, -sz,   sx,  sy, -sz,  -sx,  sy, -sz
  ]);
  const ind = new Uint16Array([
    0, 1, 2,  2, 3, 0,  
    1, 5, 6,  6, 2, 1,  
    5, 4, 7,  7, 6, 5,  
    4, 0, 3,  3, 7, 4,  
    3, 2, 6,  6, 7, 3,  
    4, 5, 1,  1, 0, 4   
  ]);

  const pBuffer = doc.createBuffer('geom');
  const pAccessor = doc.createAccessor('pos').setArray(pos).setType('VEC3').setBuffer(pBuffer);
  const iAccessor = doc.createAccessor('ind').setArray(ind).setType('SCALAR').setBuffer(pBuffer);
  
  const mat = doc.createMaterial('Mat').setBaseColorFactor(colorArray).setRoughnessFactor(0.8);

  const prim = doc.createPrimitive()
                 .setMode(4) // TRIANGLES
                 .setAttribute('POSITION', pAccessor)
                 .setIndices(iAccessor)
                 .setMaterial(mat);

  const mesh = doc.createMesh('Mesh').addPrimitive(prim);
  const node = doc.createNode('Node').setMesh(mesh);
  scene.addChild(node);

  const io = new NodeIO();
  const glb = await io.writeBinary(doc);
  fs.writeFileSync(path.join(outDir, filename), Buffer.from(glb));
  console.log('Created', filename);
}

async function run() {
  const bone = [0.95, 0.95, 0.9, 1];
  const artery = [0.8, 0.1, 0.1, 1];
  
  // Custom mock sizes so they don't look all identical in the viewer
  await createBox('humerus_l.glb', [0.03, 0.2, 0.03], bone);
  await createBox('radius_l.glb', [0.02, 0.15, 0.02], bone);
  await createBox('ulna_l.glb', [0.02, 0.16, 0.02], bone);
  await createBox('skull.glb', [0.1, 0.12, 0.15], bone);
  await createBox('artery_brachial_l.glb', [0.01, 0.2, 0.01], artery);
}
run();
