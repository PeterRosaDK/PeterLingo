a = [1, 2]
b = [0, *a, *a]
a.append(3)
print(b)
