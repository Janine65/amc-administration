
beforeAll(async () => {
    console.log("beforeAll");
});

test('get address', async () => {
    expect.assertions(2);
    expect('Janine').toEqual('Janine');
    expect('Franken').toEqual('Franken');
});

afterAll(async () => {
    console.log("afterAll");
});