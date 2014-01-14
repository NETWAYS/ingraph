import random, bisect, heapq, decimal

random_data = [random.randrange(10**2) for i in range(10)]

def with_bisect():
    data = []
    for item in random_data:
        if item in data:
            continue
        bisect.insort(data, item)
    #data[-10**2]

def with_list():
    data = []
    for item in random_data:
        if item in data:
            continue
        data.append(item)
    data.sort()
    #data[-10**2]

def with_heapq():
    data = []
    for item in random_data:
        if item in data:
            continue
        heapq.heappush(data, item)
    #heapq.nlargest(10**2, data)


random_float_data = [random.triangular(0.0, float(10**5)) for i in range(10**3)]

def with_hash():
    value = hash(format(decimal.Decimal('2345435245.2342355425'), '.4f'))
    for float_ in random_float_data:
        value == hash(format(float_, '.4f'))

def without_hash():
    value = format(decimal.Decimal('2345435245.2342355425'), '.4f')
    for float_ in random_float_data:
        value == format(float_, '.4f')

if __name__ == '__main__':
    import timeit
    #print(timeit.timeit("with_bisect()", setup="from __main__ import with_bisect", number=100000))
    #print(timeit.timeit("with_list()", setup="from __main__ import with_list", number=100000))
    #print(timeit.timeit("with_heapq()", setup="from __main__ import with_heapq", number=100000))
    print(timeit.timeit("with_hash()", setup="from __main__ import with_hash", number=10000))
    print(timeit.timeit("without_hash()", setup="from __main__ import without_hash", number=10000))

