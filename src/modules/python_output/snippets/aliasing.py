a = [1]
b = a
a += [2]
a = a + [3]
print(a, b, a is b)
