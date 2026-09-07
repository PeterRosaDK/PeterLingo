def g():
    yield 1
    return 9
it = g()
print(next(it))
try:
    next(it)
except StopIteration as e: print(e.value)
