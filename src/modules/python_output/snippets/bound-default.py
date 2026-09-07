fs = []
for i in range(3):
    fs.append(lambda i=i: i)
print([f() for f in fs])
