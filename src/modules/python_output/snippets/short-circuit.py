def f():
    print("called")
    return 4
print(0 and f(), 2 or f())
