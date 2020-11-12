const effect = {
    name: "Weapon Surge",
    modifier: {
        stat: "attack",
        value: 1,
        type: "status",
    },
    damageDice: {
        selector: "damage",
        diceNumber: 1,
    },
    iconPath: "systems/pf2e/icons/spells/weapon-surge.jpg",
};
(async () => {
    if((actor.data.data.customModifiers[effect.modifier.stat] || []).some(customModifier => customModifier.name === effect.name)){
        if (token.data.effects.includes(effect.iconPath)) {
            await token.toggleEffect(effect.iconPath);
        }
        await actor.removeCustomModifier(effect.modifier.stat, effect.name);
        await actor.removeDamageDice(damageDice.selector, damageDice.name);
    }else{
        if (!token.data.effects.includes(effect.iconPath)) {
            await token.toggleEffect(effect.iconPath);
        }
        await actor.addCustomModifier(effect.modifier.stat, effect.name, effect.modifier.value, effect.modifier.type);
        await actor.addDamageDice({ ...effect.damageDice, name: effect.name });
    }
})();