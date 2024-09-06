import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    products: [{
        type: mongoose.ObjectId,
        ref: "Products",
    }, ],
    payment: {},
    buyer: {
        type: mongoose.ObjectId,
        ref: "users",
    },
    status: {
        type: String,
        default: "Not Process",
        enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
    },
    buyFrom: {
        type: Date,
        default: Date.now,
    },
    buyTill: {
        type: Date,
        default: Date.now,
    },
    totalAmount: {
        type: Number,
        required: true
    },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);