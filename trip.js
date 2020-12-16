const action = {
    name: "Trip",
    skill: "Athletics",
    targetDC: "Reflex",
    requirements:
        "You have at least one hand free. Your target can’t be more than one size larger than you.",
    description:
        "You try to knock an opponent to the ground. Attempt an Athletics check against the target’s Reflex DC.",
    degreesOfSuccess: {
        criticalSuccess:
            "The target falls and lands prone and takes 1d6 bludgeoning damage.",
        success: "The target falls and lands prone.",
        criticalFailure: "You lose your balance and fall and land prone.",
    }, // criticalSuccess, success, failure, criticalFailure - leave step absent for no effect
    maxSize: 1, // maximum steps up in size that the target can be
    attack: true, // absent (false), true, or "agile"
};
(async () => {
    const skillRoll = () => {
        const skillKey = Object.keys(actor.data.data.skills).find(
            (key) =>
                actor.data.data.skills[key].name === action.skill.toLowerCase()
        );
        const options = actor.getRollOptions([
            "all",
            "skill-check",
            action.skill.toLowerCase(),
        ]);
        options.push(action.name.toLowerCase());
        if (action.attack) {
            options.push("attack");
        }
        actor.data.data.skills[skillKey].roll(event, options, (roll) => {
            let resultMessage = `<hr /><h3>${action.name}</h3>`;
            let validTarget = false;
            const sizeArray = Object.keys(CONFIG.PF2E.actorSizes);
            const characterSizeIndex = sizeArray.indexOf(
                actor.data?.data?.traits?.size?.value
            );
            for (const target of game.user.targets) {
                const dc =
                    target.actor?.data?.data?.saves?.[
                        action.targetDC.toLowerCase()
                    ]?.value + 10;
                if (dc) {
                    validTarget = true;
                    resultMessage += `<hr /><b>${target.name}:</b>`;
                    const legalSize =
                        action.maxSize >=
                        sizeArray.indexOf(
                            target.actor?.data?.data?.traits?.size?.value
                        ) -
                            characterSizeIndex;
                    if (legalSize) {
                        let successStep =
                            roll.total >= dc
                                ? roll.total >= dc + 10
                                    ? 3
                                    : 2
                                : roll.total > dc - 10
                                ? 1
                                : 0;
                        switch (roll.terms[0].results[0].result) {
                            case 20:
                                successStep++;
                                break;
                            case 1:
                                successStep--;
                                break;
                        }
                        if (successStep >= 3) {
                            resultMessage += `<br />💥 <b>Critical Success</b>`;
                            if (action.degreesOfSuccess?.criticalSuccess) {
                                resultMessage += `<br />${action.degreesOfSuccess.criticalSuccess}`;
                            }
                        } else if (successStep === 2) {
                            resultMessage += `<br />✔️ <b>Success</b>`;
                            if (action.degreesOfSuccess?.success) {
                                resultMessage += `<br />${action.degreesOfSuccess.success}`;
                            }
                        } else if (successStep === 1) {
                            resultMessage += `<br />❌ <b>Failure</b>`;
                            if (action.degreesOfSuccess?.failure) {
                                resultMessage += `<br />${action.degreesOfSuccess.failure}`;
                            }
                        } else if (successStep <= 0) {
                            resultMessage += `<br />💔 <b>Critical Failure</b>`;
                            if (action.degreesOfSuccess?.criticalFailure) {
                                resultMessage += `<br />${action.degreesOfSuccess.criticalFailure}`;
                            }
                        }
                    } else {
                        resultMessage += `<br />⚠️ <b>The target is too big!</b>`;
                    }
                }
            }
            if (validTarget) {
                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker(),
                    content: resultMessage,
                });
            }
        });

    };
    const skillRollWithitem = async () => {
        let potency = 0;
        actor.data.items.filter(w => w.type === "weapon" && w.data.equipped?.value === true && w.data.traits.value?.some(t => t === action.name.toLowerCase())).forEach(t => potency = (potency >= parseInt(t.data.potencyRune.value))? potency : parseInt(t.data.potencyRune.value));
        if (potency >= 1) { // to filter +null
            await actor.addCustomModifier(
                action.skill.toLowerCase(),
                "WeaponPotency",
                potency,
                "item"
            );
        }
        skillRoll();
        await actor.removeCustomModifier(
            action.skill.toLowerCase(),
            "WeaponPotency"
        );
        await actor.removeCustomModifier(
            action.skill.toLowerCase(),
            "Multiple Attack Penalty"
        );
    };
    const skillRollWithMAP = async (penalty) => {
        await actor.addCustomModifier(
            action.skill.toLowerCase(),
            "Multiple Attack Penalty",
            penalty,
            "untyped"
        );
        skillRollWithitem();
        await actor.removeCustomModifier(
            action.skill.toLowerCase(),
            "Multiple Attack Penalty"
        );
    };
    if (action.attack) {
        new Dialog({
            title: `${action.name}`,
            content: `
                ${
                    action.requirements
                        ? `<strong>Requirements</strong> ${action.requirements}<hr>`
                        : ""
                }
                ${action.description ? `${action.description}<hr>` : ""}
            `,
            buttons: {
                first: {
                    label: "1st attack",
                    callback: skillRollWithitem
                },
                second: {
                    label: "2nd attack",
                    callback: () => {
                        skillRollWithMAP(action.attack === "agile" ? -4 : -5);
                    },
                },
                third: {
                    label: "3rd attack",
                    callback: () => {
                        skillRollWithMAP(action.attack === "agile" ? -8 : -10);
                    },
                },
            },
            default: "first",
        }).render(true);
    } else {
        skillRollWithitem();
    }
})();
