class Box:
    def __len__(self):
        return 0
b = Box()
print(bool(b), b or "empty")
