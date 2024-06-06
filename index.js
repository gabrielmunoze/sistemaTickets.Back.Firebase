/* eslint-disable max-len */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

// const {getDatabase} = require("firebase-admin/database");
// const sanitizer = require("./sanitizer");

// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
// const {firestore} = require("firebase-firestore");
const admin = require("firebase-admin");
// const { orderBy } = require("firebase/firestore");
initializeApp();
// const firestore = admin.firestore();
const db = admin.firestore();

// initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.addmessage = onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await getFirestore()
      .collection("tickets")
      .add({original: original});
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

exports.addTicket2 = onCall({cors: [/firebase\.com$/, "http://localhost:3000", "http://localhost:3001"]}, async (request) => {
  const ticketData = request.data.newTicket;
  console.log(ticketData);
  const fechaTicket = admin.firestore.Timestamp.fromDate(new Date());
  let tamanioDB = 0;
  await db.collection("tickets").get().then((querySnapshot) => {
    tamanioDB = querySnapshot.size;
  });
  const ticketNuevo = {
    idTicket: tamanioDB,
    descripcion: ticketData.descripcion,
    estado: ticketData.estado,
    fecha: fechaTicket,
    prioridad: ticketData.prioridad,
    tipo: ticketData.tipo,
    titulo: ticketData.titulo,
  };
  try {
    const writeResult = await getFirestore()
        .collection("tickets")
        .add(ticketNuevo);
    let dataTicket = {};


    await db.collection("tickets").doc(writeResult.id).get().then((ticket) => {
      console.log(ticket.data());
      dataTicket = ticket.data();
    });
    // return writeResult.id;
    return dataTicket;
  } catch (error) {
    throw new HttpsError;
  }
});

exports.addTicket = onRequest(async (request) => {
  console.log(request);
  return request;
});

exports.getTicket = onCall({cors: [/firebase\.com$/, "http://localhost:3000", "http://localhost:3001"]}, async (request) => {
  const arrayData = [];
  await db.collection("tickets").orderBy("fecha", "asc").get().then((querySnapshot) => {
    querySnapshot.forEach(async (coleccion) => {
      const data = coleccion.data();
      console.log(data);
      const idBD = coleccion.id;
      data.idBD = idBD;
      arrayData.push(data);
    });
  });
  try {
    return arrayData;
  // eslint-disable-next-line no-unreachable
  } catch (error) {
    throw new HttpsError;
  }
});

exports.getNuevoTicket = onCall({cors: [/firebase\.com$/, "http://localhost:3000", "http://localhost:3001"]}, async (request) => {
  let dataTicket = {};
  await db.collection("tickets").doc(request.idDocumento).get().then((ticket) => {
    console.log(ticket);
    dataTicket = ticket;
  });
  try {
    return dataTicket;
  // eslint-disable-next-line no-unreachable
  } catch (error) {
    throw new HttpsError;
  }
});

exports.updateTicket = onCall({cors: [/firebase\.com$/, "http://localhost:3000", "http://localhost:3001"]}, async (request) => {
  const ticketData = request.data.updatedTicket;
  console.log(ticketData);
  const ticketDataUpdated = {
    prioridad: ticketData.prioridad,
    estado: ticketData.estado,
  };
  try {
    const writeResult = await db.collection("tickets").doc(ticketData.idBD).update(ticketDataUpdated);
    return {result: `Message with ID: ${writeResult.id} added.`};
  } catch (error) {
    throw new HttpsError;
  }
});

// Listens for new messages added to /messages/:documentId/original
// and saves an uppercased version of the message
// to /messages/:documentId/uppercase
exports.makeuppercase = onDocumentCreated("/tickets/{documentId}", (event) => {
  // Grab the current value of what was written to Firestore.
  const original = event.data.data().original;

  // Access the parameter `{documentId}` with `event.params`
  logger.log("Uppercasing", event.params.documentId, original);

  const uppercase = original.toUpperCase();

  // You must return a Promise when performing
  // asynchronous tasks inside a function
  // such as writing to Firestore.
  // Setting an 'uppercase' field in Firestore document returns a Promise.
  return event.data.ref.set({uppercase}, {merge: true});
});
