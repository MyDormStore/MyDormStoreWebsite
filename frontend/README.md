# 🛒 My Dorm Store Interactive Checkout Page (React Demo)

> Production URL is: [my-dorm-store-demo.vercel.app](https://my-dorm-store-demo.vercel.app)

This is a demo interactive checkout page for **My Dorm Store** built with _React_, using _Zustand_ for global state management and _React Context_ for scoped data sharing. The interface is designed to streamline the purchasing experience, especially in the context of student residences and their specific item requirements.

---

## 🎯 Features

-   ✅ **Smart Cart Matching**

    -   Automatically matches items in the cart with those required or recommended for a student's specific residence.

-   ✅ **Intuitive Layout**

    -   Cart displayed on the **left**
    -   Checkout details (shipping, billing, and payment) on the **right**

-   ✅ **Smooth User Flow**

    -   Clearly guided steps from cart to payment
    -   Shipment details (shipping & billing) collected **before** payment entry

-   ✅ **Responsive Design**

    -   Design works with different screen sizes from mobile to desktop

---

## 🧩 Tech Stack

-   **React** – Front-end UI framework
-   **Zustand** – Lightweight global state management
-   **React Context** – Scoped, component-specific state sharing

---

## 📦 Current Functionality

1. **Dynamic Cart Display**

    - Real-time updates based on user interaction and residence requirements.

2. **Checkout Form**

    - Collects shipping information
    - Billing information follows shipping (toggle coming soon)

3. **Payment Section**
    - Clean and simple UI for final payment input (mock implementation)

---

## 🚧 Next Steps

1. **Add Billing Toggle**

    - Let users specify if billing address differs from shipping.

2. **Express Checkout**
    - Letting users use express payments such as Apple Pay, Google Pay or Paypal.

---

## 🏁 Getting Started

1. **Install dependencies:**

    ```bash
    yarn
    ```

2. **Start development server:**

    ```bash
    yarn dev
    ```

---

## 📌 Notes

This project is a prototype designed to demonstrate a clean and efficient checkout experience tailored to students' needs. While the current implementation focuses on UI/UX and data flow, it can be easily extended to include backend integration, validation, and payment APIs.

---
