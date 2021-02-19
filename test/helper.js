const defaultIndex = 'WPR21F2BZT';
const defaultKey = 'FTBT+6SPTLB7BNCYJEYZ';

function generatePathByIndexKey(editMode, index, key) {
    index = index || defaultIndex;
    if (editMode) {
        key = key || defaultKey;
        key = '!' + key;
    } else {
        key = '';
    }
    return '?!' + index + key;
}

const elementWithStateCheck = async (driver, by, state) => {
    return (await driver.findElement(by).getAttribute('class')).includes(state);
};

const elementWithoutStateCheck = async (driver, by, state) => {
    return !(await elementWithStateCheck(driver, by, state));
};

const elementWithState = (driver, by, state) => {
    return async () => {
        return await elementWithStateCheck(driver, by, state);
    };
};

const elementWithoutState = (driver, by, state) => {
    return async () => {
        return await elementWithoutStateCheck(driver, by, state);
    };
};

const elementAppearsCheck = async (driver, by) => {
    var appears = true;
    try {
        await driver.findElement(by);
    } catch (e) {
        if (e.name == 'NoSuchElementError') {
            appears = false;
        } else {
            throw e;
        }
    }
    return appears;
};

const elementDisappearsCheck = async (driver, by) => {
    return !(await elementAppearsCheck(driver, by));
};

const elementAppears = (driver, by) => {
    return async () => {
        return await elementAppearsCheck(driver, by);
    };
};

const elementDisappears = (driver, by) => {
    return async () => {
        return await elementDisappearsCheck(driver, by);
    };
};

module.exports = {
    defaultIndex,
    defaultKey,
    generatePathByIndexKey,
    elementWithState,
    elementWithStateCheck,
    elementWithoutState,
    elementWithoutStateCheck,
    elementAppears,
    elementAppearsCheck,
    elementDisappears,
    elementDisappearsCheck,
};