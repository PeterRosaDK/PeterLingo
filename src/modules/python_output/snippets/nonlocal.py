def outer():
    x = 1
    def f():
        nonlocal x
        x += 2
        return x
    return f
f = outer(); print(f(), f())
