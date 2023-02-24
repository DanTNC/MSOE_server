const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const {  Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT, screen } = require('./constants');

describe('[toolbox] MSOE UI', () => {
    const helper = new Helper();
    
    const driver = helper.buildDriver();
    
    var home;
    
    const chords = {
        "C": "#[C*@E*@G*@]",
        "Dm": "#[D*@F*@A*@]",
        "Em": "#[E*@G*@B*@]",
        "F": "#[F*@A*@c*@]",
        "G": "#[G*@B*@d*@]",
        "Am": "#[A*@c*@e*@]",
        "Bm": "#[B*@d*@^f*@]",
    };
    
    before(async () => { // get public ip using shell command
        home = await helper.getHomeAddress();
    });
    
    beforeEach(async () => { // hide modals and enter preview mode
        await helper.goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
        await driver.findElement(By.xpath('//*[text()="Toolbox"]')).click();
        await helper.waitAnimatedShowing(By.id('toolbox'));
    });
    
    it('should insert corresponding chord notes when entering chord names', async () => {
        const chordSymbol = helper.randomChoice(Object.keys(chords));
        await driver.findElement(By.id('chordsym')).sendKeys(chordSymbol, Key.ENTER);
        expect(await driver.executeScript("return MSOE.getNoteOf('path.note.l0.m0.v0:eq(0)', 0)")).to.equal("$" + chords[chordSymbol]);
    });
    
    after(async () => driver.quit());
});