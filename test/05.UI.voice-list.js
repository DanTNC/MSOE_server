const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[voice-list] MSOE UI', () => {
    class Clef {
        constructor(name, color) {
            this.name = name;
            this.color = color;
        }
    }
    
    const clefs = [new Clef('treble', 'olive'), new Clef('alto', 'yellow'),
                    new Clef('tenor', 'orange'), new Clef('bass', 'brown')];
    
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
    
    describe('[list]', () => { // dependency: MSOE.js
        const randomName = () => {
            var name = "";
            var alphabetIndices = new Array(26);
            for (let i = 0; i < 3; i++) {
                name += String.fromCharCode(65 + helper.randomIndex(alphabetIndices));
            }
            return name;
        };
        
        const randomInitVoices = async (useRandomName, atLeast) => {
            atLeast = atLeast || 2;
            const numVoice = helper.randomIndex(new Array(3)) + atLeast; // at least two voices
            const chosenClefs = [];
            const voiceNames = [];
            for (let i = 0; i < numVoice; i++) {
                if (i != 0) {
                    await driver.executeScript('MSOE.AddVoice();');
                }
                let [index, clef] = helper.randomItem(clefs);
                chosenClefs.push(clef);
                await driver.executeScript('MSOE.ClfOrVic(49 + arguments[0], true, arguments[1]);', index, i);
                let name = useRandomName? randomName(): String(i);
                await driver.executeScript('MSOE.ChgVicName(arguments[0]);', name);
                voiceNames.push(name);
            }
            
            await driver.executeScript('MSOE.print();');
            
            return {numVoice, chosenClefs, voiceNames};
        };
        
        it('should show current voices with their name and clef', async () => {
            const { numVoice, chosenClefs, voiceNames } = await randomInitVoices();
            const voicesDiv = await driver.findElement(By.css('#voices>div>div'));
            expect(await voicesDiv.findElements(By.css('.row'))).to.have.lengthOf(numVoice);
            expect(await voicesDiv.findElements(By.css('.v_div'))).to.have.lengthOf(numVoice - 1);
            for (let i = 0; i < numVoice; i++) {
                const voiceDiv = await voicesDiv.findElement(By.xpath(`div[@class="row"][${i + 1}]/div`));
                expect(await voiceDiv.findElement(By.css('.v_num')).getAttribute('innerHTML')).to.equal(String(i + 1));
                expect(await voiceDiv.findElement(By.css('.v_clef')).getText()).to.equal(chosenClefs[i].name);
                expect(await voiceDiv.findElement(By.css('.v_name')).getText()).to.equal(voiceNames[i]);
                expect((await voiceDiv.getAttribute('class')).includes(chosenClefs[i].color)).to.be.true;
            }
        });
        
        it('should swap voices when user clicks on left-most numbers of two voices sequentially', async () => {
            const { numVoice } = await randomInitVoices(false);
            const A_index = helper.randomIndex(new Array(numVoice));
            var B_index_temp = helper.randomIndex(new Array(numVoice - 1));
            var B_index;
            if (B_index_temp >= A_index) {
                B_index = B_index_temp + 1;
            } else {
                B_index = B_index_temp;
            }
            
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_num")])[${A_index + 1}]`)).click();
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_num")])[${B_index + 1}]`)).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index + 1}]`)).getText()).to.equal(String(B_index));
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${B_index + 1}]`)).getText()).to.equal(String(A_index));
        });
        
        it('should swap a voice and its next voice when user clicks down icon', async () => {
            const { numVoice } = await randomInitVoices(false);
            const A_index = helper.randomIndex(new Array(numVoice - 1));
            
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_down")])[${A_index + 1}]`)).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index + 1}]`)).getText()).to.equal(String(A_index + 1));
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index + 2}]`)).getText()).to.equal(String(A_index));
        });
        
        it('should swap a voice and its next voice when user clicks up icon', async () => {
            const { numVoice } = await randomInitVoices(false);
            const A_index = helper.randomIndex(new Array(numVoice - 1)) + 1;
            
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_up")])[${A_index + 1}]`)).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index + 1}]`)).getText()).to.equal(String(A_index - 1));
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index}]`)).getText()).to.equal(String(A_index));
        });
        
        it('should move a voice to between two voices when user clicks the divider of them', async () => {
            const { numVoice } = await randomInitVoices(false, 3);
            const A_index = helper.randomIndex(new Array(numVoice));
            const div_index = helper.randomIndex(new Array(numVoice - 1));
            const dst_index = (div_index >= A_index)? div_index: (div_index + 1);
            
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_num")])[${A_index + 1}]`)).click();
            await driver.findElement(By.xpath(`(//div[contains(@class, "v_div")])[${div_index + 1}]`)).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${dst_index + 1}]`)).getText()).to.equal(String(A_index));
        });
        
        it('should move the cursor to the voice when user clicks the voice name', async () => {
            const { numVoice } = await randomInitVoices(false);
            const A_index = helper.randomIndex(new Array(numVoice));
            
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index + 1}]`)).click();
            
            await driver.executeScript('MSOE.ChgVicName("cursor"); MSOE.print();');
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index + 1}]`)).getText()).to.equal('cursor');
        });
    });
    
    describe('[voice-control]', async () => { // dependency: MSOE.js
        it('should add a voice after current voice when user clicks plus icon', async () => {
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/a[contains(@class, "item")][i[contains(@class, "plus")]]')).click();
            
            await driver.executeScript('MSOE.ChgVicName("cursor"); MSOE.print();');
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[2]`)).getText()).to.equal('cursor');
        });
        
        it('should add a voice before current voice when user clicks plus icon while holding "ctrl"', async () => {
            const plusButton = await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/a[contains(@class, "item")][i[contains(@class, "plus")]]'));
            await plusButton.click();
            await driver.actions().move({origin: plusButton}).keyDown(Key.CONTROL).click().keyUp(Key.CONTROL).perform();
            
            await driver.executeScript('MSOE.ChgVicName("cursor"); MSOE.print();');
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[2]`)).getText()).to.equal('cursor');
        });
        
        it('should delete current voice when user clicks minus icon', async () => {
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/a[contains(@class, "item")][i[contains(@class, "plus")]]')).click();
            await driver.executeScript('MSOE.ChgVicName("cursor"); MSOE.print();');
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/a[contains(@class, "item")][i[contains(@class, "minus")]]')).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[1]`)).getText()).to.not.equal('cursor');
        });
        
        it('should change the voice name of current voice when user enters voice name in input and clicks check icon', async () => {
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/div[contains(@class, "item")]/div[contains(@class, "input")]/input')).sendKeys('test');
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/div[@class="right menu"]/a[contains(@class, "item")][i[contains(@class, "check")]]')).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[1]`)).getText()).to.equal('test');
        });
        
        it('should keep the voice name of current voice when user enters a voice name containing " and show error', async () => {
            const defaultVoiceName = await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[1]`)).getText();
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/div[contains(@class, "item")]/div[contains(@class, "input")]/input')).sendKeys('test"');
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/div[@class="right menu"]/a[contains(@class, "item")][i[contains(@class, "check")]]')).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[1]`)).getText()).to.equal(defaultVoiceName);
            var errorMes = '';
            const errorDiv = await driver.findElement(By.id('error'));
            await driver.wait(async () => {
                const shown = errorDiv.isDisplayed();
                if (shown) {
                    errorMes = await errorDiv.findElement(By.xpath('p')).getText();
                }
                return shown;
            }, ANIMATION_TIMEOUT);
            
            expect(errorMes).to.equal('A voicename can\'t contain ".');
        });
        
        it('should reset the voice name of current voice when user clicks remove icon', async () => {
            const defaultVoiceName = await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[1]`)).getText();
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/div[contains(@class, "item")]/div[contains(@class, "input")]/input')).sendKeys('test');
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/div[@class="right menu"]/a[contains(@class, "item")][i[contains(@class, "check")]]')).click();
            await driver.findElement(By.xpath('//*[@class="left"]/div[contains(@class, "menu")][2]/div[@class="right menu"]/a[contains(@class, "item")][i[contains(@class, "remove")]]')).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[1]`)).getText()).to.equal(defaultVoiceName);
        });
    });
    
    after(async () => driver.quit());
});