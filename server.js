require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT;

const corsOptions = {
  origin: ['https://membershipform-omega.vercel.app', 'https://dashboard-three-lilac-57.vercel.app'],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use express-fileupload without specifying tempFileDir
app.use(fileUpload({
  useTempFiles: true,  // Enable use of temporary files for uploading
}));

app.options('*', cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://membershipform-omega.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error.message));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const memberSchema = new mongoose.Schema({
  fullName: String,
  UID: String,
  department: String,
  year: String,
  semester: String,
  email: String,
  phoneNumber: String,
  technicalSkills: String,
  softSkills: String,
  certifications: String,
  extracurricularActivities: String,
  previousPositions: String,
  achievements: String,
  interests: [String],
  preferredRole: String,
  socialMedia: {
    linkedIn: String,
    github: String,
  },
  languages: [String],
  specialSkills: String,
  suggestions: String,
  feedback: String,
  cvPortfolioUrl: String,
  imageUrl: String, // Added for image upload
});

const Member = mongoose.model('Member', memberSchema);

// API Endpoint to Save Member Data
app.post('/api/members', async (req, res) => {
  try {
    const { files } = req;
    const {
      fullName, UID, department, year, semester,
      email, phoneNumber, technicalSkills, softSkills,
      certifications, extracurricularActivities, previousPositions,
      achievements, interests, preferredRole, socialMedia,
      languages, specialSkills, suggestions, feedback,
    } = req.body;

    let cvPortfolioUrl = null;
    let imageUrl = null;

    // Create form data to send to Cloudinary
    const formDataCV = new FormData();
    const formDataImage = new FormData();

    // Upload CV/Portfolio to Cloudinary using form-data
    if (files && files.cvPortfolio) {
      formDataCV.append('file', fs.createReadStream(files.cvPortfolio.tempFilePath));  // Use tempFilePath directly
      formDataCV.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
      formDataCV.append('resource_type', 'raw');  // For non-image files like PDF, DOC, etc.

      // Send to Cloudinary using axios
      const uploadResponseCV = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
        formDataCV,
        { headers: formDataCV.getHeaders() }
      );
      cvPortfolioUrl = uploadResponseCV.data.secure_url;
    }

    // Upload Image to Cloudinary using form-data
    if (files && files.image) {
      formDataImage.append('file', fs.createReadStream(files.image.tempFilePath));  // Use tempFilePath directly
      formDataImage.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
      formDataImage.append('resource_type', 'image');  // For image files

      // Send to Cloudinary using axios
      const uploadResponseImage = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
        formDataImage,
        { headers: formDataImage.getHeaders() }
      );
      imageUrl = uploadResponseImage.data.secure_url;
    }

    // Create a new member document
    const newMember = new Member({
      fullName,
      UID,
      department,
      year,
      semester,
      email,
      phoneNumber,
      technicalSkills,
      softSkills,
      certifications,
      extracurricularActivities,
      previousPositions,
      achievements,
      preferredRole,
      languages: JSON.parse(languages || '[]'),
      specialSkills,
      suggestions,
      feedback,
      cvPortfolioUrl,
      imageUrl,
    });

    // Save the new member to the database
    await newMember.save();

    // Send a success response
    res.status(201).json({ message: 'Member created successfully!' });
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const members = await Member.find();
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
