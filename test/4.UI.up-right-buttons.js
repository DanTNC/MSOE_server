const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT, DOWNLOAD_TIMEOUT } = require('./constants');

describe('[up-right-buttons] MSOE UI', () => {
    const preview_buttons = ['Play', 'Print', 'Share'];
    const edit_buttons = ['Save', 'Toolbox', 'QR Code'];
    
    const helper = new Helper();
    
    const driver = helper.buildDriver();
    
    var home;
    
    before(async () => { // get public ip using shell command
        home = await helper.getHomeAddress();
    });
    
    beforeEach(async () => { // hide modals and enter preview mode
        await helper.goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
    });
    
    describe('[Preview]', () => {
        it('should switch to text "Edit"', async () => {
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            var textChanged = true;
            try {
                await driver.wait(until.elementLocated(By.xpath('//*[text()="Edit"]')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	textChanged = false;
                } else {
                	throw e;
                }
            }
            
            expect(textChanged).to.be.true;
        });
        
        it('should show preview-buttons and -panel', async () => {
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Edit"]')), ANIMATION_TIMEOUT);
            for (let preview_button of preview_buttons) {
                expect(await driver.findElement(By.xpath(`//*[text()="${preview_button}"]`)).isDisplayed()).to.be.true;
            }
            
            expect(await driver.findElement(By.css('.panel-group-preview')).isDisplayed()).to.be.true;
        });
        
        it('should hide edit-buttons and -panels', async () => {
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Edit"]')), ANIMATION_TIMEOUT);
            for (let edit_button of edit_buttons) {
                expect(await driver.findElement(By.xpath(`//*[text()="${edit_button}"]`)).isDisplayed()).to.be.false;
            }
            
            expect(await driver.findElement(By.css('.left')).getCssValue('display')).to.equal('none');
            expect(await driver.findElement(By.css('.panel-group')).isDisplayed()).to.be.false;
        });
    });
    
    
    describe('[Edit]', () => {
        beforeEach(async () => {
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Edit"]')), ANIMATION_TIMEOUT);
        });
        
        it('should switch to text "Preview"', async () => {
            await driver.findElement(By.xpath('//*[text()="Edit"]')).click();
            var textChanged = true;
            try {
                await driver.wait(until.elementLocated(By.xpath('//*[text()="Preview"]')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	textChanged = false;
                } else {
                	throw e;
                }
            }
            
            expect(textChanged).to.be.true;
        });
        
        it('should show edit-buttons and -panels', async () => {
            await driver.findElement(By.xpath('//*[text()="Edit"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Preview"]')), ANIMATION_TIMEOUT);
            for (let edit_button of edit_buttons) {
                expect(await driver.findElement(By.xpath(`//*[text()="${edit_button}"]`)).isDisplayed()).to.be.true;
            }
            
            expect(await driver.findElement(By.css('.left')).getCssValue('display')).to.not.equal('none');
            expect(await driver.findElement(By.css('.panel-group')).isDisplayed()).to.be.true;
        });
        
        it('should hide preview-buttons and -panel', async () => {
            await driver.findElement(By.xpath('//*[text()="Edit"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Preview"]')), ANIMATION_TIMEOUT);
            for (let preview_button of preview_buttons) {
                expect(await driver.findElement(By.xpath(`//*[text()="${preview_button}"]`)).isDisplayed()).to.be.false;
            }
            
            expect(await driver.findElement(By.css('.panel-group-preview')).isDisplayed()).to.be.false;
        });
    });
    
    describe('[Night]', () => {
        it('should switch to text "Default"', async () => {
            await driver.findElement(By.xpath('//*[text()="Night"]')).click();
            var textChanged = true;
            try {
                await driver.wait(until.elementLocated(By.xpath('//*[text()="Default"]')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	textChanged = false;
                } else {
                	throw e;
                }
            }
            
            expect(textChanged).to.be.true;
        });
        
        it('should change sheet background color to "rgba(9, 9, 9, 1)"', async () => {
            await driver.findElement(By.xpath('//*[text()="Night"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Default"]')), ANIMATION_TIMEOUT);
            
            expect(await driver.findElement(By.id('sheet')).getCssValue('background-color')).to.equal('rgba(9, 9, 9, 1)');
        });
        
        it('should change hint message state to "brown"', async () => {
            await driver.findElement(By.xpath('//*[text()="Night"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Default"]')), ANIMATION_TIMEOUT);
            
            expect(await helper.elementWithStateCheck(By.id('hint'), 'brown')).to.be.true;
        });
    });
    
    describe.only('[Default]', () => {
        beforeEach(async () => {
            await driver.findElement(By.xpath('//*[text()="Night"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Default"]')), ANIMATION_TIMEOUT);
        });
        
        it('should switch to text "Night"', async () => {
            await driver.findElement(By.xpath('//*[text()="Default"]')).click();
            var textChanged = true;
            try {
                await driver.wait(until.elementLocated(By.xpath('//*[text()="Night"]')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	textChanged = false;
                } else {
                	throw e;
                }
            }
            
            expect(textChanged).to.be.true;
        });
        
        it('should change sheet background color to "rgba(0, 0, 0, 0)"', async () => {
            await driver.findElement(By.xpath('//*[text()="Default"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Night"]')), ANIMATION_TIMEOUT);
            
            expect(await driver.findElement(By.id('sheet')).getCssValue('background-color')).to.equal('rgba(0, 0, 0, 0)');
        });
        
        it('should change hint message state to "blue"', async () => {
            await driver.findElement(By.xpath('//*[text()="Default"]')).click();
            await driver.wait(until.elementLocated(By.xpath('//*[text()="Night"]')), ANIMATION_TIMEOUT);
            
            expect(await helper.elementWithStateCheck(By.id('hint'), 'blue')).to.be.true;
        });
    });
    
    after(async () => driver.quit());
});