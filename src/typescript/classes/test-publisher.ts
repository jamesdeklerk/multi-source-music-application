let aaaa = publisher.subscribe("aaa", function (a: any) {
    console.log(`aaa event ${a}`);
});
publisher.subscribe("aaa", function (a: any) {
    console.log(`aaa event number 2 ${a}`);
});
publisher.subscribe("bbb", function (a: any) {
    console.log(`bbb event ${a}`);
});
publisher.subscribe(`ccc`, function (hmm: any, num: number) {
    console.log(`ccc ${hmm} ${num * 2}`);
});

publisher.publish(`aaa`, `right now!`);

publisher.unsubscribe(`aaa`, aaaa);

setTimeout(function () {
    publisher.publish(`ccc`, `noooice!`, 4);
}, 1000);
