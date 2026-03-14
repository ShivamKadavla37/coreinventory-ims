const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ where: { email } });
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: 'Email already registered and verified. Please login.' });
      } else {
        // Update existing unverified user with new password and OTP
        user.name = name;
        user.password = hashedPassword;
        user.role = role || 'staff';
        user.signupOtp = otp;
        user.signupOtpExpires = otpExpires;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'staff',
        isVerified: false,
        signupOtp: otp,
        signupOtpExpires: otpExpires,
      });
    }

    // Send the OTP via email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: '"CoreInventory" <noreply@coreinventory.com>',
        to: email,
        subject: 'Verify your CoreInventory Account',
        text: `Your account verification OTP is: ${otp}\nThis code will expire in 10 minutes.`,
        html: `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #f43f5e; padding: 30px; text-align: center;">
            <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 16px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">📦</span>
            </div>
            <h2 style="color: white; margin: 0; font-size: 24px;">Welcome to CoreInventory!</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h3 style="margin-top: 0; color: #111827; font-size: 20px;">Verify your email address</h3>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">Hello,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">Thank you for registering with CoreInventory. To complete your signup and secure your account, please use the following One-Time Password (OTP):</p>
            
            <div style="background-color: #fff1f2; margin: 30px 0; padding: 20px; border-radius: 8px; text-align: center; border: 1px dashed #fda4af;">
              <span style="font-size: 36px; font-weight: 700; color: #e11d48; letter-spacing: 6px;">${otp}</span>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; font-style: italic;">This code will expire securely in exactly 10 minutes.</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">If you didn't create an account with us, please safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
            <p style="font-size: 13px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} CoreInventory. All rights reserved.</p>
          </div>
        </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      
      res.status(201).json({
        message: 'OTP sent to your email. Please verify to complete signup.',
        requireOtp: true,
        email: user.email
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      res.status(500).json({ message: 'Failed to send OTP email.' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// POST /api/auth/verify-signup
router.post('/verify-signup', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ 
      where: { 
        email,
        signupOtp: otp,
        signupOtpExpires: {
          [Op.gt]: new Date()
        }
      } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.signupOtp = null;
    user.signupOtpExpires = null;
    await user.save();

    // Generate JWT now that they are verified
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Account verified successfully.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Verify signup error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email address before logging in.', unverified: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // JWT is stateless; logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully.' });
});

// Utility to send reset link email
const sendResetLinkEmail = async (email, resetLink) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: '"CoreInventory" <noreply@coreinventory.com>',
    to: email,
    subject: 'Action Required: Reset Your Password',
    text: `You requested a password reset. Please click the following link to reset your password:\n${resetLink}\nThis link will expire in 15 minutes.`,
    html: `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #f43f5e; padding: 30px; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 24px;">Password Reset</h2>
      </div>
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">We successfully verified your OTP. To complete your password reset process, please click the secure link below to choose a new password.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #e11d48; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Set New Password</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">If the button above does not work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #e11d48; word-break: break-all; background: #fff1f2; padding: 10px; border-radius: 4px;">${resetLink}</p>
        <p style="font-size: 14px; color: #6b7280; font-style: italic; margin-top: 20px;">For security reasons, this link will automatically expire in 15 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} CoreInventory. All rights reserved.</p>
      </div>
    </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Utility to send OPT for resetting password
const sendPasswordResetOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: '"CoreInventory" <noreply@coreinventory.com>',
    to: email,
    subject: 'Your Password Reset OTP Code',
    text: `Your OTP code to verify your password reset is: ${otp}\nThis code will expire in 10 minutes.`,
    html: `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #3b82f6; padding: 30px; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 24px;">Security Verification</h2>
      </div>
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">We received a request to reset your password. To authorize this change, please enter the following One-Time Password (OTP) back on the website:</p>
        
        <div style="background-color: #eff6ff; margin: 30px 0; padding: 20px; border-radius: 8px; text-align: center; border: 1px dashed #bfdbfe;">
          <span style="font-size: 36px; font-weight: 700; color: #2563eb; letter-spacing: 6px;">${otp}</span>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; font-style: italic;">This security code will expire in 10 minutes.</p>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">If you did not request a password reset, your account is safe, and you can simply ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} CoreInventory. All rights reserved.</p>
      </div>
    </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = otpExpires;
    await user.save();

    try {
      await sendPasswordResetOtpEmail(user.email, otp);
      res.json({ message: 'OTP sent to your email.' });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      res.status(500).json({ message: 'Failed to send OTP email.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during forgot password.' });
  }
});

// POST /api/auth/verify-reset-otp
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
      where: { 
        email,
        resetPasswordOtp: otp,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Generate secure token for the link since OTP was proven
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetPasswordOtp = token;
    user.resetPasswordExpires = tokenExpires;
    await user.save();

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    try {
      await sendResetLinkEmail(user.email, resetLink);
      res.json({ message: 'Password reset link has been successfully sent to your email.' });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      res.status(500).json({ message: 'Failed to send reset email.' });
    }
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    const user = await User.findOne({ 
      where: { 
        resetPasswordOtp: token,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password has been safely reset. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during reset password.' });
  }
});

// GET /api/auth/profile — get current user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided.' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: ['id', 'name', 'email', 'role', 'createdAt'] });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// PUT /api/auth/profile — update current user profile
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided.' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const { name, email } = req.body;
    if (name) user.name = name;
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(400).json({ message: 'Email already in use.' });
      user.email = email;
    }
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

module.exports = router;
