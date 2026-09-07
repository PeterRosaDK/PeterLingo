a = ([1],)
try:
    a[0] += [2]
except TypeError:
    pass
print(a)
