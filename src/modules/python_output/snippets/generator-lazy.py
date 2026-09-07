a = [1, 2]
g = (x * 2 for x in a)
a.append(3)
print(list(g))
