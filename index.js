const io = require("socket.io")(8900, {
  cors: {
    origin: "*"
    
  },
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("A user connected.");

  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    receiverId.forEach((id) => {
      const user = getUser(id);
      if (user) {
        io.to(user.socketId).emit("getMessage", { senderId, text });
      }
    });
  });
  // Listen for new posts
  socket.on("createPost", (post) => {
    console.log("New post created:", post);
    // Broadcast the new post to all connected clients
    io.emit("newPost", post);
  });

  // Listen for post deletions
  socket.on("deletePost", ({ postId }) => {
    console.log(`Post deleted: ${postId}`);
    // Notify all connected clients about the deleted post
    io.emit("postDeleted", { postId });
  });
 
  // Listen for new comments
  socket.on("newComment", ({ postId, comment }) => {
    // Emit the new comment to all users connected to the  post
    io.emit("updateComments", { postId, comment });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});