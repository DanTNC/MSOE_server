mocha.setup("bdd");

var expect = chai.expect;
describe("Add function", function(){
   it("should return the sum of two variables", function(){
        expect(3 + 4).to.equal(7);
   }) 
});

window.onload = function() {
    mocha.run();  
};