const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 4000;
const cors = require('cors');
const jwt = require('jsonwebtoken')
const multer = require('multer')
const mongoose = require('mongoose');
const productController = require('./controllers/productController')
const userController = require('./controllers/userController')
const { likeProduct } = require('./controllers/userController');
const { sanitizeInput } = require('./middleware/security');

app.use(cors());
app.use(sanitizeInput);  


// Use memory storage for serverless deployment
const storage = process.env.VERCEL ? 
  multer.memoryStorage() : 
  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
const upload = multer({ storage: storage })
// Try Atlas first, fallback to local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nirajgupta54180_db_user:ECWUJLa66xEiJYgm@ashraya.yhrt2gk.mongodb.net/?retryWrites=true&w=majority&appName=ashraya';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
}).catch(err => {
  console.log('MongoDB connection failed:', err.message);
  if (!process.env.MONGODB_URI) {
    console.log('Trying local MongoDB...');
    return mongoose.connect('mongodb://localhost:27017/aashraya');
  }
}).catch(err => {
  console.log('All MongoDB connections failed:', err.message);
});

app.use(express.json({ limit: '8mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '8mb' })); // Parse URL-encoded bodies with size limit
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads'), {
  dotfiles: 'deny',
  index: false
}));



app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.get('/search', productController.search)
app.post('/like-product', userController.likeProduct)
app.post('/dislike-product', userController.dislikeProduct )
app.post('/add-product', upload.fields([{name: 'pimage'}, {name: 'pimage2'}]), productController.addProduct)
app.post('/edit-product', upload.fields([{name: 'pimage'}, {name: 'pimage2'}]), productController.editProduct)
app.get('/get-products', productController.getProduct)
app.post('/delete-product', productController.deleteProduct)
app.get('/get-product/:pId', productController.getProductById)
app.post('/liked-products', userController.likedProduct)
app.post('/my-product', productController.myProduct)
app.post('/signup', userController.signUp)
app.get('/my-profile/:userId', userController.myProfileById)
app.post('/login', userController.login)
app.get('/get-user/:uId', userController.getUserById)




app.listen(PORT, ()=>{
    console.log("App is running on port 4000")
})