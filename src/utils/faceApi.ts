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

  // Threshold for blink is typically 0.2
  return avgEAR < 0.22;
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

export function compareEmbeddings(embedding1: Float32Array, embedding2: Float32Array) {
  const distance = faceapi.euclideanDistance(embedding1, embedding2);
  // Typical threshold for face recognition is 0.6. Lower is more strict (better for payments).
  return distance < 0.45;
}
