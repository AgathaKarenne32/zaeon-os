// server.js
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Inicializa a aplicação Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handle);

    // Anexa o Socket.IO ao servidor HTTP do Next.js
    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("⚡ Novo agente conectado ao Socket:", socket.id);

        // 1. O utilizador junta-se a uma "sala" com o seu próprio ID (para receber mensagens privadas)
        socket.on("join_own_room", (userId) => {
            socket.join(userId);
            console.log(`Agente ${userId} entrou na sua sala pessoal.`);
        });

        // 2. CHAT PRIVADO: Encaminha a mensagem diretamente para o ID do destinatário
        socket.on("send_private_message", (data) => {
            // data contém: { receiverId, messageObj }
            // Transmite a mensagem apenas para a sala do recetor
            socket.to(data.receiverId).emit("receive_private_message", data.messageObj);
        });

        // 3. COMUNIDADE (Preparação para o próximo passo): Junta-se ao Lounge
        socket.on("join_community", (roomName) => {
            socket.join(roomName);
        });

        socket.on("disconnect", () => {
            console.log("Agente desconectado:", socket.id);
        });
    });

    httpServer.once("error", (err) => {
        console.error(err);
        process.exit(1);
    });

    httpServer.listen(port, () => {
        console.log(`> Servidor Zaeon OS pronto e a escutar em http://${hostname}:${port}`);
    });
});