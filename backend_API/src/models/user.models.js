const mongoose = require('mongoose')
const Password = require('./password.models')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const Schema = mongoose.Schema

const options = { toObject: { virtuals: true } }

const user_schema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, 'Please Provide a valid Email'],
    },
    role: {
      type: String,
      required: true,
      enum: ['EndUser', 'Admin'],
      default: 'EndUser',
    },
    password: {
      type: String,
      required: [true, 'Please provide your password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password
        },
        message: 'Password do not match',
      },
    },
  },
  options,
  { timestamp: true },
)

// Virtual Property to get user password from Password collection
// user_schema.virtual('password', {
//     ref: "Password",
//     localField: "_id",
//     foreignField: "user_id",
//     justOne: true
// })

// user_schema.pre('save', () => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // Save password reference for user in Password collection
//       await Password.create({
//         user_id: this._id,
//         password: this.password,
//         role: this.role,
//       })

//       // Set password field in User collection to null
//       this.password = null

//       resolve(this)
//     } catch (error) {
//       reject(error)
//     }
//   })
// })
user_schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  this.passwordConfirm = undefined
  next()
})

user_schema.methods.comparePassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}
const User = mongoose.model('User', user_schema)

module.exports = User
