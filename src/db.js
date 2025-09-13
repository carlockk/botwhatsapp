import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Conectado exitosamente a MongoDB.");
    return client.db("botwhatsapp"); // Puedes cambiar "botwhatsapp" al nombre de tu base de datos si es diferente
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
    throw error;
  }
}

async function closeDatabaseConnection() {
  try {
    await client.close();
    console.log("Conexión a MongoDB cerrada.");
  } catch (error) {
    console.error("Error al cerrar la conexión:", error);
  }
}

export { connectToDatabase, closeDatabaseConnection };