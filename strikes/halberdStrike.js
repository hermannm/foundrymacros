const weapon = {
  name: "Halberd",
  damageTypes: ["Piercing", "Slashing"],
  tags: ["Attack", "Reach", "Versatile S"],
  description: [
    "This polearm has a relatively short, 5-foot shaft. The business end is a long spike with an axe blade attached.",
    {
      title: "Versatile",
      text:
        "A versatile weapon can be used to deal a different type of damage than that listed in the Damage entry. You choose the damage type each time you make an attack.",
    },
  ],
  criticalSpecialization: {
    group: "Polearm",
    description:
      "The target is moved 5 feet in a direction of your choice. This is forced movement.",
  },
};
(async () => {
  const actionFormat = ({ actions, name, tags, content }) => {
    const checkTitle = (paragraph) =>
      typeof paragraph === "object"
        ? `<strong>${paragraph.title}</strong> ${paragraph.text}`
        : paragraph;
    return `
      <header style="display: flex; font-size: 14px">
        <img
          style="flex: 0 0 36px; margin-right: 5px;"
          src="systems/pf2e/icons/actions/${actions}.png"
          title="${name}"
          width="36"
          height="36"
        >
        <h3 style="flex: 1; line-height: 36px; margin: 0;">
          ${name}
        </h3>
      </header>
      ${
        tags
          ? `
            <hr style="margin-top: 3px; margin-bottom: 1px;" />
            <div class="tags" style="
              margin-bottom: 5px;
            ">
              ${tags
                .map(
                  (tag) => `
                    <span class="tag tag_alt"">${tag}</span>`
                )
                .join(" ")}
            </div>
          `
          : `<hr style="margin-top: 3px;" />`
      }
      <div style="font-weight: 500; font-size: 14px;">
        ${content
          .map((paragraph) =>
            Array.isArray(paragraph)
              ? paragraph
                  .map((subParagraph) => checkTitle(subParagraph))
                  .join(`<div style="margin-bottom: 5px;"></div>`)
              : checkTitle(paragraph)
          )
          .join("<hr />")}
      </div>
    `;
  };
  const slugify = (string) =>
    // borrowed from https://gist.github.com/codeguy/6684588
    string
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  const strikeItem = (actor.data.data.actions ?? [])
    .filter((action) => action.type === "strike")
    .find((strike) => strike.name === weapon.name);
  const shortDamageTypes = weapon.damageTypes.map((damageType) =>
    damageType.charAt(0).toLowerCase()
  );
  const strike = (MAP) => {
    const options = [
      ...actor.getRollOptions(["all", "str-based", "attack", "attack-roll"]),
      ...(weapon.tags ? weapon.tags.map((tag) => slugify(tag)) : []),
    ];
    switch (MAP) {
      case 1:
        strikeItem.attack({ event, options });
        break;
      case 2:
        strikeItem.variants[1]?.roll({ event, options });
        break;
      case 3:
        strikeItem.variants[2]?.roll({ event, options });
        break;
    }
  };
  const damage = ({ crit, type }) => {
    const options = [
      ...actor.getRollOptions(["all", "str-based", "damage", "damage-roll"]),
      ...(weapon.tags ? weapon.tags.map((tag) => slugify(tag)) : []).filter(
        (tag) => !tag.startsWith("versatile") || tag.slice(-1) === type
      ),
    ];
    // temporary fix until versatile is fixed
    const versatileTrait = strikeItem.traits.find(
      (trait) =>
        trait.name.startsWith("versatile-") && !options.includes(trait.name)
    )?.name;
    if (versatileTrait) {
      strikeItem.traits.find(
        (trait) => trait.name === versatileTrait
      ).name = `not-${versatileTrait}`;
    }
    //
    if (crit) {
      strikeItem.critical({
        event,
        options,
        callback: () => {
          if (weapon.criticalSpecialization) {
            ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker(),
              content: actionFormat({
                actions: "Passive",
                name: `Critical Specialization`,
                tags: [weapon.criticalSpecialization.group],
                content: [weapon.criticalSpecialization.description],
              }),
            });
          }
        },
      });
    } else {
      strikeItem.damage({ event, options });
    }
    if (versatileTrait) {
      strikeItem.traits.find(
        (trait) => trait.name === `not-${versatileTrait}`
      ).name = versatileTrait;
    }
  };
  const modifiers = strikeItem.variants.map((variant) => {
    let modifier = strikeItem.totalModifier;
    const splitLabel = variant.label.split(" ");
    if (splitLabel[0] === "MAP") {
      modifier += parseInt(splitLabel[1]);
    }
    return modifier;
  });
  const modToString = (modifier) =>
    modifier >= 0 ? `+${modifier}` : `${modifier}`;
  const dialog = new Dialog({
    title: " ",
    content: `
      ${actionFormat({
        actions: "OneAction",
        name: `${weapon.name} Strike`,
        tags: weapon.tags,
        content: [
          [
            ...weapon.description,
            {
              title: "Critical Specialization",
              text: weapon.criticalSpecialization.description,
            },
          ],
        ],
      })}
      <div class="dialog-buttons" style="margin-top: 5px;">
        <button
          class="dialog-button firstStrike"
          data-button="firstStrike"
          style="margin-bottom:5px;"
        >
          1st (${modToString(modifiers[0])})
        </button>
        <button
          class="dialog-button secondStrike"
          data-button="secondStrike"
          style="margin-bottom:5px;"
        >
          2nd (${modToString(modifiers[1])})
        </button>
        <button
          class="dialog-button thirdStrike"
          data-button="thirdStrike"
          style="margin-bottom:5px;"
        >
          3rd (${modToString(modifiers[2])})
        </button>
      </div>
      <hr />
      <div style="
        display: flex;
        justify-content: center;
        margin-bottom: 5px;
      "><strong>Damage</strong></div>
      <div style="
        display: flex;
        margin-top: 5px;
      ">
        ${weapon.damageTypes
          .map(
            (damageType) => `
              <div style="
                flex-basis: 50%;
                display: flex;
                justify-content: center;
              ">
                <strong>${damageType}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="dialog-buttons">
        ${shortDamageTypes
          .map(
            (damageType) => `
              <button
                class="dialog-button damage-${damageType}"
                data-button="damage-${damageType}"
                style="margin-bottom:5px;"
              >
                ✔️
              </button>
            `
          )
          .join("")}
      </div>
    `,
    buttons: {},
  });
  for (const damageType of shortDamageTypes) {
    dialog.data.buttons[`critical-${damageType}`] = {
      label: "💥",
      callback: () => {
        damage({ crit: true, type: damageType });
      },
    };
  }
  dialog.render(true);
  for (const damageType of shortDamageTypes) {
    dialog.data.buttons[`damage-${damageType}`] = {
      callback: () => {
        damage({ crit: false, type: damageType });
      },
    };
  }
  dialog.data.buttons.firstStrike = {
    callback: () => {
      strike(1);
    },
  };
  dialog.data.buttons.secondStrike = {
    callback: () => {
      strike(2);
    },
  };
  dialog.data.buttons.thirdStrike = {
    callback: () => {
      strike(3);
    },
  };
})();
