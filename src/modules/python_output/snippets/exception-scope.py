e = "old"
try:
    raise ValueError()
except ValueError as e:
    pass
print(e)
