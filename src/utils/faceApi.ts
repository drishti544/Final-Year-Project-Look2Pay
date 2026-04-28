import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/';

export async function loadModels() {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}tiny_face_detector`),
      faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}face_landmark_68`),
      faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}face_recognition`),
    ]);
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
}

export const getFaceDetectorOptions = () => {
  return new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
};

export async function detectFace(videoElement: HTMLVideoElement) {
  return await faceapi
    .detectSingleFace(videoElement, getFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
}

export async function getFaceEmbedding(videoElement: HTMLVideoElement) {
  const detection = await detectFace(videoElement);
  return detection ? detection.descriptor : null;
}

export function isBlinking(landmarks: faceapi.FaceLandmarks68) {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  const getEAR = (eye: faceapi.Point[]) => {
    const vertical1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
    const vertical2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
    const horizontal = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
    return (vertical1 + vertical2) / (2 * horizontal);
  };

  const leftEAR = getEAR(leftEye);
  const rightEAR = getEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;

  // Threshold for blink is typically 0.2, increasing to 0.3 for high sensitivity
  return avgEAR < 0.30;
}

export function isSmiling(landmarks: faceapi.FaceLandmarks68) {
  const mouth = landmarks.getMouth();
  
  // Mouth center points
  const leftCorner = mouth[0];
  const rightCorner = mouth[6];
  const topLip = mouth[3];
  const bottomLip = mouth[9];

  const width = Math.sqrt(Math.pow(rightCorner.x - leftCorner.x, 2) + Math.pow(rightCorner.y - leftCorner.y, 2));
  const height = Math.sqrt(Math.pow(bottomLip.y - topLip.y, 2) + Math.pow(bottomLip.y - topLip.y, 2));
  
  const ratio = height / width;
  
  // Very basic smile detection - ratio increases when mouth opens/smiles
  // Better approach: distance between corners vs distance between nose and chin?
  // Let's use mouth width vs eye distance
  const leftEye = landmarks.getLeftEye()[0];
  const rightEye = landmarks.getRightEye()[3];
  const eyeDist = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));
  
  return width > eyeDist * 0.85; // Heuristic: smiling widens the mouth relative to eye distance
}

export function getFaceOrientation(landmarks: faceapi.FaceLandmarks68) {
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const jaw = landmarks.getJawOutline();

  // Eye centers
  const leftEyeCenter = {
    x: leftEye.reduce((acc, p) => acc + p.x, 0) / 6,
    y: leftEye.reduce((acc, p) => acc + p.y, 0) / 6
  };
  const rightEyeCenter = {
    x: rightEye.reduce((acc, p) => acc + p.x, 0) / 6,
    y: rightEye.reduce((acc, p) => acc + p.y, 0) / 6
  };
  const eyesCenter = {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2
  };

  const noseTip = nose[3];
  
  // Yaw (Shake): Rotation around the vertical axis.
  // We compare the nose tip horizontal position to the midpoint between the eyes.
  // Normalized by eye distance.
  const eyeDistance = Math.sqrt(Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) + Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2));
  const yaw = (noseTip.x - eyesCenter.x) / eyeDistance;

  // Pitch (Nod): Rotation around the horizontal axis.
  // We look at the vertical distance from eye line to nose tip.
  const pitch = (noseTip.y - eyesCenter.y) / eyeDistance;

  return { yaw, pitch };
}

export function compareEmbeddings(embedding1: Float32Array, embedding2: Float32Array) {
  return faceapi.euclideanDistance(embedding1, embedding2);
}
