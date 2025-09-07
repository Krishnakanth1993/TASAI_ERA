# 🧠 CNN Classifier for MNIST Handwritten Digits

This project implements a **compact Convolutional Neural Network (CNN)** with approximately **25,000 parameters**, designed and trained on the **MNIST** dataset using **PyTorch**.

---

## 📚 1. About the MNIST Dataset

**MNIST** (Modified National Institute of Standards and Technology) is a widely used dataset for benchmarking image classification models.

- **Images:** 70,000 grayscale images of handwritten digits (0–9)
- **Size:** 28x28 pixels
- **Split:**
  - 60,000 training images
  - 10,000 test images
- **Classes:** 10 (digits 0 through 9)

---

## ⚖️ 2. Why Normalize the Data?

Normalization rescales the pixel intensity values to help the network train more effectively.

### 🔢 Typical normalization for MNIST:
```python
transforms.Normalize((0.1307,), (0.3081,))
```
✅ **Benefits:**
- Speeds up convergence
- Prevents vanishing/exploding gradients
- Stabilizes learning across layers

---

## 🧪 3. Data Augmentation

While MNIST is relatively clean, data augmentation helps improve generalization, especially for compact networks.

**Techniques Used:**
```python
transforms.Compose([
    transforms.RandomRotation(10),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize((0.1307,), (0.3081,))
])
```
✅ **Advantages:**
- Reduces overfitting
- Improves robustness to real-world variations in handwriting
- Simulates rotation, translation, and distortion

---

## 🧠 4. CNN Architecture & Parameters

✅ **Layer-wise Summary**
```python
class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(1, 16, kernel_size=3)      # 28x28 → 26x26
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3)     # 26x26 → 24x24
        self.conv3 = nn.Conv2d(32, 40, kernel_size=3)     # 12x12 → 10x10
        self.conv4 = nn.Conv2d(40, 24, kernel_size=1)     # 5x5 → 5x5
        self.fc1   = nn.Linear(24 * 5 * 5, 10)            # 600 → 10

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.max_pool2d(x, 2)
        x = F.relu(self.conv3(x))
        x = F.max_pool2d(x, 2)
        x = F.relu(self.conv4(x))
        x = x.view(-1, 24 * 5 * 5)
        x = self.fc1(x)
        return F.log_softmax(x, dim=1)
```

📊 **Parameter Breakdown**

| Layer | Description                  | Parameters |
|-------|------------------------------|------------|
| Conv1 | 1 input → 16 filters (3x3)   | 160       |
| Conv2 | 16 → 32 filters (3x3)        | 4,640     |
| Conv3 | 32 → 40 filters (3x3)        | 11,600    |
| Conv4 | 40 → 24 filters (1x1)        | 984       |
| FC1   | Fully connected (600 → 10)   | 6,010     |
| **Total** |                          | **23,394** ✅ |

---

## 📈 5. Optimizer Observations

Both SGD and Adam were tested for training the model.

| Optimizer | Convergence Speed | Final Accuracy (MNIST) | Comments                  |
|-----------|-------------------|------------------------|---------------------------|
| SGD      | Slower            | ~96%                   | Needs careful LR tuning  |
| Adam     | Faster            | ~98%                   | Recommended for quick convergence |

💡 **Insight:**  
Adam adapts learning rates per parameter using moment estimates, making it significantly faster than vanilla SGD, especially for smaller models.

### 🧪 Training Configuration

| Parameter       | Value     |
|-----------------|-----------|
| Batch Size      | 64        |
| Epochs          | 15–20     |
| Loss Function   | nn.NLLLoss() |
| Activation      | ReLU      |
| Final Activation| log_softmax |
| Optimizer       | Adam      |

---

## 🧾 Requirements

```bash
pip install torch torchvision matplotlib
```

---

## 🔍 Visualizing the Model

To fully visualize the model including activations and pooling, export it to ONNX:

```python
torch.onnx.export(model, 
                  torch.randn(1, 1, 28, 28), 
                  "model.onnx", 
                  input_names=['input'], 
                  output_names=['output'], 
                  dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
                  opset_version=11)
```
Then view it in [https://netron.app](https://netron.app).

---

## 🎯 Future Work

- Add Dropout for regularization
- Use BatchNorm to stabilize training
- Explore deeper variants with similar param budgets
- Test on Fashion-MNIST or CIFAR-10

---

## 📌 Final Notes

✅ Compact architecture with ~23K parameters  
✅ Achieves ~98% test accuracy on MNIST with Adam  
✅ Designed for learning, experimentation, and speed  

---

## 📎 License

MIT License

---

## ✍️ Author

Your Name — [@yourgithub](https://github.com/yourgithub)