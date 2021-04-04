const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const UserSchema = mongoose.Schema({

    email: {
        type: String,
        trim: true
    },
    id: {
        type: String,
        trim: true
    },fb_id:{type:String},
    name: {
        type: Number,
    },
    login_types: {
        type: String,
    }, profile_pic: { type: String }
},
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);
module.exports = mongoose.model('Videocall_app', UserSchema);