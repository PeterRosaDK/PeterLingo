def f(x=[]):
    x.append(len(x))
    return x.copy()
print(f(), f())
