def f():
    a = []
    try:
        return a
    finally:
        a.append(1)
print(f())
