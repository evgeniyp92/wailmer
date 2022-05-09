// @ts-nocheck
const fib = function (n) {
  if (n < 2) return 1;
  return fib(n - 1) + fib(n - 2);
};

const factorial = function (n) {
  debugger;
  if (n === 0 || n === 1) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
};

const array = [1, [2, [3, [4]]]];

const flatten = function (arr) {
  let result = [];
  for (el of arr) {
    if (!Array.isArray(el)) {
      result.push(el);
    } else {
      result = result.concat(flatten(el));
    }
  }
  return result;
};

console.log(flatten(array));
