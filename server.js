require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');

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
app.use(fileUpload({ useTempFiles: true }));

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

// Member Schema
// Member Schema
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

    // Upload CV/Portfolio to Cloudinary
    if (files && files.cvPortfolio) {
      const uploadResponse = await cloudinary.uploader.upload(
        files.cvPortfolio.tempFilePath,
        { folder: 'Uploads', resource_type: 'raw' }
      );
      cvPortfolioUrl = uploadResponse.secure_url;
    }

    // Upload Image to Cloudinary
    if (files && files.image) {
      const uploadResponse = await cloudinary.uploader.upload(
        files.image.tempFilePath,
        { folder: 'Images', resource_type: 'image' }
      );
      imageUrl = uploadResponse.secure_url;
    }

    // Create Member Document
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
      interests: JSON.parse(interests || '[]'),
      preferredRole,
      socialMedia: JSON.parse(socialMedia || '{}'),
      languages: JSON.parse(languages || '[]'),
      specialSkills,
      suggestions,
      feedback,
      cvPortfolioUrl,
      imageUrl, // Save image URL
    });

    // Save Member Data
    await newMember.save();

    res.status(200).send({
      message: 'Member data saved successfully!',
      data: newMember,
    });
  } catch (error) {
    console.error('Error saving member data:', error.message);
    res.status(500).send({ message: 'Error saving member data' });
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
