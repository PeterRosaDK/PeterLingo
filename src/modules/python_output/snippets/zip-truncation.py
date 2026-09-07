it = iter([1, 2, 3])
pairs = list(zip([0], it))
print(pairs, next(it))
print(list(it))
