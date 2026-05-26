const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require("discord.js");

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// ======================================================
// ======================================================



// ======================================================
// CATEGORIAS
// ======================================================

const CATEGORIA_TICKETS = "1508672322201194507";
const CATEGORIA_HISTORICOS = "1508666248429309983";

// ======================================================
// LOGS
// ======================================================

const CANAL_LOGS = "1508823179924209714";

// ======================================================
// STAFF
// ======================================================

const CARGOS_VERIFICADORES = [
    "1484675449186418688",
    "1490778989248254045",
    "1495437507960115331"
];

const GESTAO = "1484675449186418688";

// ======================================================
// CARGOS VERIFICADOS
// ======================================================

const CARGOS_VERIFICADO = [
    "1500680948520321187",
    "1490778503380074506",
    "1490779917070372914"
];

// ======================================================
// CONTADOR
// ======================================================

let ticketCounter = 0;

// ======================================================
// ANTI SPAM
// ======================================================

const cooldownTickets = new Map();

// ======================================================
// AUTO CLOSE
// ======================================================

const autoClose = new Map();

function iniciarAutoClose(channel) {

    if (autoClose.has(channel.id)) {
        clearTimeout(autoClose.get(channel.id));
    }

    const timeout = setTimeout(async () => {

        try {

            await channel.send(
                "⏰ Ticket fechado por inatividade."
            );

            setTimeout(async () => {

                await channel.delete().catch(() => {});

            }, 3000);

        } catch {}

    }, 1000 * 60 * 30);

    autoClose.set(channel.id, timeout);
}

// ======================================================
// STAFF PERMS
// ======================================================

function staffPerms() {

    return CARGOS_VERIFICADORES.map(id => ({
        id,
        allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak
        ]
    }));
}

// ======================================================
// LOG
// ======================================================

async function criarLog(guild, texto) {

    const canal = guild.channels.cache.get(CANAL_LOGS);

    if (!canal) return;

    canal.send(texto).catch(() => {});
}

// ======================================================
// MESSAGE CREATE
// ======================================================

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    if (
        message.channel.parentId === CATEGORIA_TICKETS
    ) {

        iniciarAutoClose(message.channel);
    }

    // ======================================================
    // AJUDA
    // ======================================================

    if (message.content === "!ajuda") {

        const embed = new EmbedBuilder()
            .setColor("#c8a96b")
            .setTitle("📖 Central de Comandos")
            .setDescription(`
\`!verify\` → painel principal
\`!painel\` → enviar painel
\`!fechar\` → fechar ticket
\`!limpar\`
\`!status\`
            `);

        return message.channel.send({
            embeds: [embed]
        });
    }

    // ======================================================
    // STATUS
    // ======================================================

    if (message.content === "!status") {

        return message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#c8a96b")
                    .setTitle("📊 Status")
                    .setDescription(`
🤖 Online

👥 Servidores:
${client.guilds.cache.size}
                    `)
            ]
        });
    }

    // ======================================================
    // LIMPAR
    // ======================================================

    if (message.content.startsWith("!limpar")) {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageMessages
            )
        ) return;

        await message.channel.bulkDelete(100, true);

        return message.channel.send("🧹 Canal limpo.");
    }

    // ======================================================
    // FECHAR
    // ======================================================

    if (message.content === "!fechar") {

        await message.channel.send(
            "🔒 Ticket será fechado em 5 segundos..."
        );

        setTimeout(async () => {

            await message.channel.delete().catch(() => {});

        }, 5000);
    }

    // ======================================================
    // PAINEL
    // ======================================================

    if (
        message.content === "!verify" ||
        message.content === "!painel"
    ) {

        const painel = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("abrir_verificacao")
                .setLabel("Verificação")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("abrir_ticket")
                .setLabel("Ticket")
                .setEmoji("🎫")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("abrir_duvidas")
                .setLabel("Dúvidas")
                .setEmoji("❓")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("abrir_historico")
                .setLabel("Histórico")
                .setEmoji("📂")
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setColor("#c8a96b")
            .setTitle("🛡️ CALICE • Atendimento Oficial")
            .setDescription(`
╭━━━━━━━━━━━━━━━━╮

✅ Verificação
🎫 Ticket
❓ Dúvidas
📂 Histórico

━━━━━━━━━━━━━━━━━━

🔒 Sistema privado.

╰━━━━━━━━━━━━━━━━╯
            `)
            .setFooter({
                text: "CALICE • Atendimento Oficial"
            })
            .setTimestamp();

        return message.channel.send({
            embeds: [embed],
            components: [painel]
        });
    }
});

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async (interaction) => {

    // ======================================================
    // HISTÓRICO
    // ======================================================

    if (
        interaction.isButton() &&
        interaction.customId === "abrir_historico"
    ) {

        const modal = new ModalBuilder()
            .setCustomId("modal_historico")
            .setTitle("Criar Histórico");

        const nome = new TextInputBuilder()
            .setCustomId("nome_historico")
            .setLabel("Nome do histórico")
            .setPlaceholder("Ex: punição-pedro")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nome)
        );

        return interaction.showModal(modal);
    }

    // ======================================================
    // MODAL HISTÓRICO
    // ======================================================

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "modal_historico"
    ) {

        await interaction.deferReply({
            ephemeral: true
        });

        const nomeHistorico = interaction.fields
            .getTextInputValue("nome_historico")
            .replace(/ /g, "-")
            .toLowerCase();

        const canal = await interaction.guild.channels.create({

    name: `📁・${nomeHistorico}`,

    type: ChannelType.GuildText,

    parent: CATEGORIA_HISTORICOS,

    permissionOverwrites: [

        {
            id: interaction.guild.id,

            deny: [
                PermissionsBitField.Flags.ViewChannel
            ]
        },

        {
            id: interaction.user.id,

            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
            ]
        },

        ...staffPerms()

    ]

});


// ======================================================
// MENSAGEM AUTOMÁTICA
// ======================================================

await canal.send({

    content:
`<@&1484675449186418688> ${interaction.user}`,

    embeds: [

        new EmbedBuilder()

        .setColor("#2f3136")

        .setTitle("📁 Histórico Criado")

        .setDescription(
`📌 Um novo histórico foi criado.

👤 Criado por:
${interaction.user}

🕒 Horário:
<t:${Math.floor(Date.now()/1000)}:F>`
        )
    ]
});


// ======================================================

return interaction.editReply({

    content:
`📁 Histórico criado: ${canal}`

});

}

    // ======================================================
    // VERIFICAÇÃO
    // ======================================================

    if (
        interaction.isButton() &&
        interaction.customId === "abrir_verificacao"
    ) {

        await interaction.deferReply({
            ephemeral: true
        });

        const tempo = cooldownTickets.get(interaction.user.id);

        if (tempo && Date.now() < tempo) {

            return interaction.editReply({
                content:
                    "❌ Aguarde alguns segundos."
            });
        }

        cooldownTickets.set(
            interaction.user.id,
            Date.now() + 15000
        );

        ticketCounter++;

        const canal = await interaction.guild.channels.create({

            name: `✅・ticket-${ticketCounter}`,
            type: ChannelType.GuildText,
            topic: interaction.user.id,
            parent: CATEGORIA_TICKETS,

            permissionOverwrites: [

                {
                    id: interaction.guild.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },

                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },

                ...staffPerms()
            ]
        });

        iniciarAutoClose(canal);

        const embed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(`✅ Ticket #${ticketCounter}`)
            .setDescription(`
🛡️ Sistema de Verificação

📌 Envie:
🖼️ Print do perfil
🎖️ Print dos cargos
🆔 Seu ID

⏰ Auto fechamento:
30 minutos

🔒 Ticket privado.
            `);

        const row = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("verificar_usuario")
                .setLabel("Verificar")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("recusar_usuario")
                .setLabel("Recusar")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId("fechar_ticket")
                .setLabel("Concluir")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Secondary)
        );

        await canal.send({

            content: `
${interaction.user}

<@&1484675449186418688>
<@&1490778989248254045>
<@&1495437507960115331>
            `,

            embeds: [embed],
            components: [row]
        });

        return interaction.editReply({
            content:
                `✅ Ticket criado: ${canal}`
        });
    }

    // ======================================================
    // TICKET / DÚVIDAS
    // ======================================================

    if (
        interaction.isButton() &&
        (
            interaction.customId === "abrir_ticket" ||
            interaction.customId === "abrir_duvidas"
        )
    ) {

        await interaction.deferReply({
            ephemeral: true
        });

        const tempo = cooldownTickets.get(interaction.user.id);

        if (tempo && Date.now() < tempo) {

            return interaction.editReply({
                content:
                    "❌ Aguarde alguns segundos."
            });
        }

        cooldownTickets.set(
            interaction.user.id,
            Date.now() + 15000
        );

        ticketCounter++;

        const tipo =
            interaction.customId === "abrir_ticket"
                ? "🎫"
                : "❓";

        const canal = await interaction.guild.channels.create({

            name: `${tipo}・ticket-${ticketCounter}`,
            type: ChannelType.GuildText,
            topic: interaction.user.id,
            parent: CATEGORIA_TICKETS,

            permissionOverwrites: [

                {
                    id: interaction.guild.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },

                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages
                    ]
                },

                ...staffPerms()
            ]
        });

        iniciarAutoClose(canal);

        const botoes = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setEmoji("🛡️")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("fechar_ticket")
                .setLabel("Concluir")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Secondary)
        );

        const painelStaff = new ActionRowBuilder().addComponents(

            new StringSelectMenuBuilder()
                .setCustomId("painel_staff")
                .setPlaceholder("Selecione uma ação")
                .addOptions([
                    {
                        label: "Notificar",
                        value: "notificar",
                        emoji: "🔔"
                    },
                    {
                        label: "Adicionar membro",
                        value: "adicionar",
                        emoji: "➕"
                    },
                    {
                        label: "Remover membro",
                        value: "remover",
                        emoji: "➖"
                    },
                    {
                        label: "Criar call",
                        value: "call",
                        emoji: "📞"
                    }
                ])
        );

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle(`${tipo} Ticket #${ticketCounter}`)
            .setDescription(`
📌 Atendimento iniciado.

⏰ Auto fechamento:
30 minutos

🔒 Canal privado.
            `);

        await canal.send({

            content: `
${interaction.user}

<@&${GESTAO}>
            `,

            embeds: [embed],
            components: [botoes, painelStaff]
        });

        return interaction.editReply({
            content:
                `${tipo} Ticket criado: ${canal}`
        });
    }

    // ======================================================
    // ASSUMIR
    // ======================================================

    if (
        interaction.isButton() &&
        interaction.customId === "assumir_ticket"
    ) {

        await interaction.deferReply();

        return interaction.editReply({
            content:
                `🛡️ Ticket assumido por ${interaction.user}`
        });
    }

    // ======================================================
    // VERIFICAR
    // ======================================================

    if (
        interaction.isButton() &&
        interaction.customId === "verificar_usuario"
    ) {

        await interaction.deferReply();

        try {

            const membro = await interaction.guild.members.fetch(
                interaction.channel.topic
            );

            for (const cargo of CARGOS_VERIFICADO) {

                await membro.roles.add(cargo);
            }

            return interaction.editReply({
                content:
                    `✅ ${membro.user.tag} foi verificado!`
            });

        } catch (err) {

            console.log(err);

            return interaction.editReply({
                content:
                    "❌ Erro ao verificar."
            });
        }
    }

    // ======================================================
    // RECUSAR
    // ======================================================

    if (
        interaction.isButton() &&
        interaction.customId === "recusar_usuario"
    ) {

        await interaction.deferReply();

        return interaction.editReply({
            content:
                `❌ Verificação recusada por ${interaction.user}`
        });
    }

    // ======================================================
    // FECHAR
    // ======================================================

    if (
        interaction.isButton() &&
        interaction.customId === "fechar_ticket"
    ) {

        await interaction.deferReply({
            ephemeral: true
        });

        await interaction.editReply({
            content:
                "🔒 Ticket será fechado em 5 segundos..."
        });

        setTimeout(async () => {

            await interaction.channel.delete().catch(() => {});

        }, 5000);
    }

    // ======================================================
    // MENU STAFF
    // ======================================================

    if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "painel_staff"
    ) {

        await interaction.deferReply({
            ephemeral: true
        });

        const valor = interaction.values[0];

        // ======================================================
        // NOTIFICAR
        // ======================================================

        if (valor === "notificar") {

            const donoId = interaction.channel.topic;

            return interaction.editReply({
                content:
                    `🔔 <@${donoId}> foi notificado.`
            });
        }

        // ======================================================
        // ADICIONAR MEMBRO
        // ======================================================

        if (valor === "adicionar") {

            const membros =
                await interaction.guild.members.fetch();

            const options = membros
                .filter(m => !m.user.bot)
                .first(25)
                .map(membro => ({
                    label: membro.user.username,
                    value: membro.id
                }));

            const menu = new ActionRowBuilder().addComponents(

                new StringSelectMenuBuilder()
                    .setCustomId("selecionar_add_membro")
                    .setPlaceholder("Escolha quem adicionar")
                    .addOptions(options)
            );

            return interaction.editReply({
                content:
                    "➕ Escolha um membro:",
                components: [menu]
            });
        }

        // ======================================================
        // REMOVER MEMBRO
        // ======================================================

        if (valor === "remover") {

            const permissoes =
                interaction.channel.permissionOverwrites.cache;

            const membrosIds = permissoes
                .filter(p =>
                    p.allow.has(
                        PermissionsBitField.Flags.ViewChannel
                    ) &&
                    p.id !== interaction.guild.id
                )
                .map(p => p.id);

            const membros = [];

            for (const id of membrosIds) {

                const membro =
                    await interaction.guild.members
                        .fetch(id)
                        .catch(() => null);

                if (
                    membro &&
                    !membro.user.bot
                ) {

                    membros.push({
                        label: membro.user.username,
                        value: membro.id
                    });
                }
            }

            if (membros.length === 0) {

                return interaction.editReply({
                    content:
                        "❌ Nenhum membro encontrado."
                });
            }

            const menu = new ActionRowBuilder().addComponents(

                new StringSelectMenuBuilder()
                    .setCustomId("selecionar_remove_membro")
                    .setPlaceholder("Escolha quem remover")
                    .addOptions(membros.slice(0, 25))
            );

            return interaction.editReply({
                content:
                    "➖ Escolha um membro:",
                components: [menu]
            });
        }

        // ======================================================
        // CALL
        // ======================================================

        if (valor === "call") {

            const call =
                await interaction.guild.channels.create({

                    name:
                        `📞・call-${interaction.user.username}`,

                    type: ChannelType.GuildVoice,

                    parent: CATEGORIA_TICKETS,

                    permissionOverwrites: [

                        {
                            id: interaction.guild.id,
                            deny: [
                                PermissionsBitField.Flags.ViewChannel
                            ]
                        },

                        {
                            id: interaction.channel.topic,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.Connect,
                                PermissionsBitField.Flags.Speak
                            ]
                        },

                        ...staffPerms()
                    ]
                });

            return interaction.editReply({
                content:
                    `📞 Call criada: ${call}`
            });
        }
    }

    // ======================================================
    // SELECT ADD MEMBRO
    // ======================================================

    if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "selecionar_add_membro"
    ) {

        await interaction.deferReply({
            ephemeral: true
        });

        const membroId = interaction.values[0];

        await interaction.channel.permissionOverwrites.edit(
            membroId,
            {
                ViewChannel: true,
                SendMessages: true
            }
        );

        return interaction.editReply({
            content:
                "✅ Membro adicionado ao ticket."
        });
    }

    // ======================================================
    // SELECT REMOVE MEMBRO
    // ======================================================

    if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "selecionar_remove_membro"
    ) {

        await interaction.deferReply({
            ephemeral: true
        });

        const membroId = interaction.values[0];

        await interaction.channel.permissionOverwrites.delete(
            membroId
        );

        return interaction.editReply({
            content:
                "❌ Membro removido do ticket."
        });
    }
});

// ======================================================
// READY
// ======================================================

client.once("ready", () => {

    console.log(`✅ Online como ${client.user.tag}`);

    client.user.setActivity(
        "CALICE • Atendimento",
        {
            type: 3
        }
    );
});

/// ======================================================
// LOGIN
// ======================================================

const TOKEN = process.env.TOKEN;

client.login(TOKEN);
