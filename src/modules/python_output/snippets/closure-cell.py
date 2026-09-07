def outer():
    x = 1
    def f(): return x
    x = 8
    return f
print(outer()())
