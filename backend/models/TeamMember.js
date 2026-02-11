import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: String,
    role: String,
    department: String,
    avatar: String,
    status: {
        type: String,
        enum: ['active', 'inactive', 'away'],
        default: 'active'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    stats: {
        bugsFixed: { type: Number, default: 0 },
        bugsOpened: { type: Number, default: 0 },
        avgResolutionTime: { type: Number, default: 0 },
        activeIssues: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;
