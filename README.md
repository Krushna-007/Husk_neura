# 🧠 HuskML

> **"Because even neural networks deserve a GUI"**  
> *No more fighting with tensor dimensions at 3 AM. We've all been there.*

[![LinkedIn](https://img.shields.io/badge/Follow%20on-LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/huskml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=for-the-badge)](LICENSE.md)
[![Live Demo](https://img.shields.io/badge/Try%20It-Live-gold?style=for-the-badge)](https://neura-huskml.maverickspectrum.com)

**Neura-HuskML** is a visual playground for designing deep learning architectures. Think Figma, but for neural networks—minus the design tears, plus the compile-time shape errors (we catch them early, promise 🙏).

---

## 🤔 Why Does This Exist?

Let's be honest: Writing `model.add()` 47 times to prototype a CNN feels like writing "I will not talk in class" on a blackboard. So we built this.

**Perfect for:**
- 🎓 **Students** learning ML who want to *see* what a ConvNet looks like before debugging PyTorch for 6 hours
- 🚀 **Researchers** rapidly prototyping architectures (no more forgetting which layer you just added)
- 👩‍🏫 **Educators** teaching DL concepts without students getting lost in boilerplate
- 🧪 **Hobbyists** who just want to build a cat classifier and move on with life

---

## ✨ Core Features

### 🎨 **Visual Architecture Builder**
Drag, drop, connect. It's like LEGO but for tensors.
- **50+ Layer Types**: Conv2D, LSTM, Attention—we've got 'em all
- **Real-Time Code Gen**: See Python (Keras/TensorFlow) update as you design
- **Smart Shape Inference**: We calculate output dimensions so you don't have to *(because math at 2 AM is nobody's friend)*

### 🧠 **Intelligent Validation**
- **Live Error Checking**: Trying to connect a `(32, 32, 3)` to a Dense layer expecting `(784,)`? We'll politely stop you.
- **Layer Cheat Sheets**: Hover over any block to see what it actually does *(no PhD required)*

### 🎭 **Retro-Futuristic UI**
- **"8-Bit from PAST" Cursor**: Because normal cursors are boring
- **Cyber-Industrial Theme**: True black + gold + cyan = chef's kiss
- **Zero Eye Strain**: Designed for those 4-hour debugging marathons

### 🔧 **Quality-of-Life Magic**
- **Export to JSON**: Save your work, share with teammates
- **Undo/Redo**: We all make mistakes (looking at you, accidental Dropout=0.99)
- **Templates**: Pre-built architectures so you don't start from scratch

---

## 🚀 Quick Start

### 🌐 Online (Zero Setup)
Just click → [huskml.maverickspectrum.com](https://neura-huskml.maverickspectrum.com)

### 💻 Local Development

```bash
# Clone this beauty
git clone https://github.com/Krushna-007/Husk_neura.git
cd Husk_neura

# Install dependencies
npm install

# Fire it up
npm run dev

# Open http://localhost:5173 and start building
```

**Tech Stack:** React + TypeScript + React Flow + Vite *(the good stuff)*

---

## 📖 How It Works

1. **Drag layers** from the palette onto the canvas
2. **Connect them** by dragging between nodes
3. **Watch the code** generate in real-time on the right
4. **Copy & run** in your Jupyter notebook or Python script

**Pro tip:** Use the Mini-Map (bottom right) to navigate complex architectures. Your future self will thank you.

---

## 🎯 Use Cases

| Use Case | Description |
|----------|-------------|
| **Rapid Prototyping** | Test 5 different architectures in 10 minutes |
| **Learning Tool** | Visualize how CNNs, RNNs, and Transformers connect |
| **Teaching** | Show students *why* dimensions matter |
| **Debugging** | Spot shape mismatches before writing a single line of code |
| **Documentation** | Export architecture diagrams for papers/presentations |

---

## 🙏 Attribution

- **Visual Concept Inspiration**: Shoutout to [blockdl.com](https://blockdl.com) for pioneering the drag-and-drop ML editor concept
- **Icons**: [Lucide React](https://lucide.dev)
- **Graph Engine**: [React Flow](https://reactflow.dev)
- **Vibes**: Countless cups of chai ☕

---

## 📜 License

**AGPL-3.0** — Use it, fork it, modify it. Just share your improvements back with the community.  
See [LICENSE.md](LICENSE.md) for the legal jazz.

---

## 🤝 Contributing

Found a bug? Want to add a feature? PRs are welcome!  
*(No judgment if it's your first one—we've all been there)*

---

## 💌 Made with ❤️ (and a lot of coffee)

Built by folks who got tired of manually writing `Conv2D((3, 3), activation='relu')` for the 100th time.

**Connect with us:**  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Follow-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/company/huskml)

---

*P.S. If this saved you from a tensor shape error, consider giving us a ⭐ on GitHub. It fuels our dopamine receptors.*
