require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const streamifier = require('streamifier');
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
app.use(fileUpload({ useTempFiles: false }));

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
  preferredRole: String,
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
      achievements, preferredRole,
      languages, specialSkills, suggestions, feedback,
    } = req.body;

    let cvPortfolioUrl = null;
    let imageUrl = null;

    // Upload CV/Portfolio to Cloudinary (using stream for Buffer)
    if (files && files.cvPortfolio) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'Uploads', resource_type: 'raw' },
        (error, result) => {
          if (error) {
            console.error('Error uploading CV/Portfolio:', error);
            return res.status(500).json({ message: 'Error uploading CV/Portfolio' });
          }
          cvPortfolioUrl = result.secure_url;
        }
      );
      streamifier.createReadStream(files.cvPortfolio.data).pipe(uploadStream);
    }

    // Upload Image to Cloudinary (using stream for Buffer)
    if (files && files.image) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'Images', resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error('Error uploading Image:', error);
            return res.status(500).json({ message: 'Error uploading Image' });
          }
          imageUrl = result.secure_url;
        }
      );
      streamifier.createReadStream(files.image.data).pipe(uploadStream);
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
      preferredRole,
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
