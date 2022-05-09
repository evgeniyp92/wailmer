# Building a multi-container application

There are some issues with a single container

- The app was simple and limited in scope -- it had no outside dependencies
- The image was built many times, without a good reason
- How do we connect to a database from a container?

We will do a program on the fibonnaci sequence

1 1 2 3 5 8 13 21 etc etc

we will go full overkill on this project, this is a super easy project irl. its
just [i-1] + [i-2]

```javascript
const fibArray = [0, 1, 1];
for (let i = 3; i < 100; i++) fibArray.push(fibArray[i - 1] + fibArray[i - 2]);
console.log(fibArray[7]);
```

## Putting together the source of the application

For this part, reference the commit with finished source
