import { NextResponse } from 'next/server';
import { connectToDatabase, closeDatabaseConnection } from '@/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Replace YOUR_VERIFY_TOKEN with the token you set in your Meta App
    const VERIFY_TOKEN = 'mi_token_de_verificacion';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verificado!');
        return new NextResponse(challenge, { status: 200 });
    } else {
        console.error('Verificación de webhook fallida.');
        return new NextResponse('Verificación de token fallida', { status: 403 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        console.log('Mensaje recibido:', JSON.stringify(data, null, 2));

        if (data.object === 'whatsapp_business_account' && data.entry && data.entry[0].changes && data.entry[0].changes[0].value.messages) {
            const message = data.entry[0].changes[0].value.messages[0];
            const from = message.from; // phone number from which the message was sent
            const type = message.type; // type of the message (text, image, etc.)
            const textBody = message.text ? message.text.body : '';

            console.log(`Mensaje de: ${from}`);
            console.log(`Contenido: ${textBody}`);

            // Conectar a la base de datos
            const db = await connectToDatabase();
            const conversationCollection = db.collection('conversations');

            // Guardar el mensaje entrante en la base de datos
            await conversationCollection.insertOne({
                from,
                message: textBody,
                timestamp: new Date(),
                direction: 'inbound'
            });

            // Lógica del bot (ejemplo simple)
            let replyMessage = '';
            const lowerCaseText = textBody.toLowerCase();

            if (lowerCaseText.includes('hola')) {
                replyMessage = '¡Hola! Soy el bot de Waffles de Carlokk. ¿En qué puedo ayudarte?';
            } else if (lowerCaseText.includes('menú')) {
                // Aquí podrías consultar la base de datos para obtener el menú
                replyMessage = 'Claro, este es nuestro menú: \n- Waffle de Nutella \n- Waffle de Frutilla \n- Waffle de Oreo';
            } else {
                replyMessage = 'Disculpa, no entendí tu mensaje. ¿Puedes ser más específico?';
            }

            // Enviar la respuesta de vuelta
            await sendWhatsAppMessage(from, replyMessage);
            
            // Guardar la respuesta saliente en la base de datos
            await conversationCollection.insertOne({
                to: from,
                message: replyMessage,
                timestamp: new Date(),
                direction: 'outbound'
            });

            await closeDatabaseConnection();
            return new NextResponse('Mensaje recibido', { status: 200 });
        }
        
        return new NextResponse('Ok', { status: 200 });

    } catch (error) {
        console.error('Error al procesar el webhook:', error);
        return new NextResponse('Error del servidor', { status: 500 });
    }
}

// Función para enviar el mensaje de vuelta a WhatsApp
async function sendWhatsAppMessage(to, message) {
    const accessToken = 'TU_TOKEN_DE_ACCESO_DE_WHATSAPP'; // Reemplaza con tu token
    const phoneNumberId = 'TU_NUMERO_DE_TELEFONO_ID'; // Reemplaza con tu ID de número de teléfono

    try {
        await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to,
                    text: { body: message },
                }),
            }
        );
        console.log('Mensaje enviado exitosamente.');
    } catch (error) {
        console.error('Error al enviar el mensaje:', error);
    }
}