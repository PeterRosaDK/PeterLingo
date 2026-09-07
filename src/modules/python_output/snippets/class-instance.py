class C:
    x = []
a, b = C(), C()
a.x.append(1)
b.x = [2]
print(a.x, b.x, C.x)
